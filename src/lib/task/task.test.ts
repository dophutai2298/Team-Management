import { describe, expect, it } from "vitest";

import type { AuthorizationActor } from "@/lib/authorization/authorization";

import { canAccessTaskWorkspace, canManagePersonalTask, canReadTask, validatePersonalTaskInput } from "./task";

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

describe("task workspace access", () => {
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
