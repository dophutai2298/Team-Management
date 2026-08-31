import { describe, expect, it } from "vitest";

import type { AuthorizationActor } from "@/lib/authorization/authorization";

import {
  canAccessTaskWorkspace,
  canAssignEmployee,
  canManagePersonalTask,
  canReadTask,
  canUpdateOwnAssignmentProgress,
  isTaskId,
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
  it("normalizes multi-assignee input and retains an optional team assignment", () => {
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
        teamId: "33333333-3333-4333-8333-333333333333",
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

  it("lets a system-wide task administrator manage personal tasks", () => {
    const personalTask = {
      taskType: "personal" as const,
      creatorEmployeeId: "report",
      teamId: null,
      assigneeEmployeeIds: [],
    };

    const admin = { ...actor, permissions: ["task:read:all", "task:update:all"] as const };

    expect(canReadTask(admin, personalTask)).toBe(true);
    expect(canManagePersonalTask(admin, "update", personalTask)).toBe(true);
  });
});
