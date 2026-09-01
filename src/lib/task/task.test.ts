import { describe, expect, it } from "vitest";

import type { AuthorizationActor } from "@/lib/authorization/authorization";

import {
  canAccessTaskWorkspace,
  canAddTaskAttachment,
  canAssignEmployee,
  canManagePersonalTask,
  canRemoveTaskAttachment,
  canReadTask,
  canUpdateOwnAssignmentProgress,
  isTaskId,
  validateTaskAttachmentUploadInput,
  TASK_ATTACHMENT_IMAGE_MAX_BYTES,
  TASK_ATTACHMENT_MAX_FILES,
  TASK_ATTACHMENT_MAX_BYTES,
  validateTaskCommentInput,
  validateAssignedTaskInput,
  validatePersonalTaskInput,
} from "./task";

const actor: AuthorizationActor = {
  accountStatus: "active",
  employeeId: "manager",
  permissions: [],
  memberships: [{ teamId: "platform", isPrimary: true }],
  descendantEmployeeIds: ["report"],
};

describe("personal task input", () => {
  it("normalizes a valid personal task payload", () => {
    expect(
      validatePersonalTaskInput({
        title: "  Prepare release notes ",
        description: "  Confirm the customer-facing changes.  ",
        priority: "HIGH",
        status: "IN_PROGRESS",
        dueDate: "2026-09-15",
      }),
    ).toEqual({
      ok: true,
      value: {
        title: "Prepare release notes",
        description: "Confirm the customer-facing changes.",
        priority: "high",
        status: "in_progress",
        dueDate: "2026-09-15",
      },
    });
  });

  it("rejects invalid titles, priorities, and dates", () => {
    expect(validatePersonalTaskInput({ title: " ", priority: "later", dueDate: "2026-99-99" })).toEqual({
      ok: false,
      code: "INVALID_TASK_INPUT",
    });
  });
});

describe("assigned task input", () => {
  it("normalizes multi-assignee input and retains multiple team assignments", () => {
    const result = validateAssignedTaskInput({
        title: "  Prepare release train  ",
        description: "  Coordinate the final checks. ",
        priority: "HIGH",
        dueDate: "2026-09-15",
        employeeIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
          "11111111-1111-4111-8111-111111111111",
        ],
        teamIds: [
          "33333333-3333-4333-8333-333333333333",
          "44444444-4444-4444-8444-444444444444",
          "33333333-3333-4333-8333-333333333333",
        ],
      });
    expect(result).toEqual({
      ok: true,
      value: {
        title: "Prepare release train",
        description: "Coordinate the final checks.",
        priority: "high",
        dueDate: "2026-09-15",
        employeeIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
        teamIds: [
          "33333333-3333-4333-8333-333333333333",
          "44444444-4444-4444-8444-444444444444",
        ],
        teamId: "33333333-3333-4333-8333-333333333333",
      },
    });
  });

  it("requires at least one employee or one team and rejects malformed identifiers", () => {
    expect(validateAssignedTaskInput({ title: "Prepare release", priority: "high" })).toEqual({
      ok: false,
      code: "INVALID_TASK_INPUT",
    });

    expect(
      validateAssignedTaskInput({
        title: "Prepare release",
        priority: "high",
        employeeIds: ["not-a-uuid"],
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_INPUT" });
  });
});

describe("task workspace access", () => {
  it("accepts standard UUID task identifiers before requesting task details", () => {
    expect(isTaskId("42b1d4e4-e60b-401e-8220-45ed58201221")).toBe(true);
    expect(isTaskId("42b1d4e4-e60b-401e-8220")).toBe(false);
  });

  it("requires an active task read capability before opening the workspace", () => {
    expect(canAccessTaskWorkspace(actor)).toBe(false);
    expect(canAccessTaskWorkspace({ ...actor, permissions: ["task:read:self"] })).toBe(true);
  });

  it("keeps another employee's personal task private from a parent", () => {
    const personalTask = {
      taskType: "personal" as const,
      creatorEmployeeId: "report",
      teamId: "platform",
      assigneeEmployeeIds: [],
    };

    const parent = { ...actor, permissions: ["task:read:subtree", "task:update:subtree"] as const };

    expect(canReadTask(parent, personalTask)).toBe(false);
    expect(canManagePersonalTask(parent, "update", personalTask)).toBe(false);
  });

  it("shows an assigned task to its assignee and their parent", () => {
    const assignedTask = {
      taskType: "assigned" as const,
      creatorEmployeeId: "manager",
      teamId: "platform",
      assigneeEmployeeIds: ["report"],
    };

    expect(canReadTask({ ...actor, employeeId: "report", permissions: ["task:read:self"] }, assignedTask)).toBe(true);
    expect(canReadTask({ ...actor, permissions: ["task:read:subtree"] }, assignedTask)).toBe(true);
  });

  it("limits parent task assignment to reports in their hierarchy while system administrators can assign anyone", () => {
    const parent = { ...actor, permissions: ["task:assign:subtree"] as const };
    const admin = { ...actor, permissions: ["task:assign:all"] as const };

    expect(canAssignEmployee(parent, "report")).toBe(true);
    expect(canAssignEmployee(parent, "manager")).toBe(false);
    expect(canAssignEmployee(parent, "outside-the-subtree")).toBe(false);
    expect(canAssignEmployee(admin, "outside-the-subtree")).toBe(true);
  });

  it("allows an assignee to update only their own assignment progress", () => {
    expect(canUpdateOwnAssignmentProgress({ ...actor, employeeId: "report", permissions: ["task:update:self"] }, "report")).toBe(true);
    expect(canUpdateOwnAssignmentProgress({ ...actor, employeeId: "report", permissions: ["task:update:self"] }, "manager")).toBe(false);
  });

  it("keeps personal tasks private even from system-wide task administrators", () => {
    const personalTask = {
      taskType: "personal" as const,
      creatorEmployeeId: "report",
      teamId: null,
      assigneeEmployeeIds: [],
    };

    const admin = { ...actor, permissions: ["task:read:all", "task:update:all"] as const };

    expect(canReadTask(admin, personalTask)).toBe(false);
    expect(canManagePersonalTask(admin, "update", personalTask)).toBe(false);
  });

  it("allows uploaders and task managers to remove attachments", () => {
    const assignedTask = {
      taskType: "assigned" as const,
      creatorEmployeeId: "manager",
      teamId: "platform",
      assigneeEmployeeIds: ["report"],
    };

    expect(canRemoveTaskAttachment({ ...actor, employeeId: "report" }, assignedTask, "report")).toBe(true);
    expect(canRemoveTaskAttachment({ ...actor, permissions: ["task:update:subtree"] }, assignedTask, "report")).toBe(true);
    expect(canRemoveTaskAttachment({ ...actor, employeeId: "peer", permissions: ["task:update:self"] }, assignedTask, "report")).toBe(false);
  });
});

describe("task collaboration input", () => {
  it("normalizes comments and enforces useful body limits", () => {
    expect(validateTaskCommentInput({ body: "  Ready for review. " })).toEqual({
      ok: true,
      value: { body: "Ready for review." },
    });
    expect(validateTaskCommentInput({ body: " " })).toEqual({ ok: false, code: "INVALID_TASK_COMMENT" });
  });

  it("accepts configured attachment types within size limits", () => {
    expect(
      validateTaskAttachmentUploadInput({
        contentType: "APPLICATION/PDF",
        fileName: "plan.pdf",
        fileSizeBytes: TASK_ATTACHMENT_MAX_BYTES,
      }),
    ).toEqual({
      ok: true,
      value: {
        contentType: "application/pdf",
        fileName: "plan.pdf",
        fileSizeBytes: TASK_ATTACHMENT_MAX_BYTES,
      },
    });
  });

  it("accepts known business file extensions when the browser omits the MIME type", () => {
    expect(
      validateTaskAttachmentUploadInput({
        contentType: "",
        fileName: "meeting-notes.docx",
        fileSizeBytes: 256_000,
      }),
    ).toEqual({
      ok: true,
      value: {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName: "meeting-notes.docx",
        fileSizeBytes: 256_000,
      },
    });
  });

  it("limits images to the image size cap and rejects unsupported file types", () => {
    expect(
      validateTaskAttachmentUploadInput({
        contentType: "image/png",
        fileName: "large-image.png",
        fileSizeBytes: TASK_ATTACHMENT_IMAGE_MAX_BYTES + 1,
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_ATTACHMENT" });

    expect(
      validateTaskAttachmentUploadInput({
        contentType: "application/x-msdownload",
        fileName: "setup.exe",
        fileSizeBytes: 128,
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_ATTACHMENT" });
  });

  it("caps active attachments at five files per task", () => {
    expect(canAddTaskAttachment(TASK_ATTACHMENT_MAX_FILES - 1)).toBe(true);
    expect(canAddTaskAttachment(TASK_ATTACHMENT_MAX_FILES)).toBe(false);
    expect(canAddTaskAttachment(-1)).toBe(false);
  });
});
