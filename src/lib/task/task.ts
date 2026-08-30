import { isAuthorized, type AuthorizationActor } from "@/lib/authorization/authorization";
import type { PermissionAction } from "@/lib/authorization/catalog";

export const TASK_TYPES = ["personal", "assigned"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done", "cancelled"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type PersonalTaskInput = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
};

export type TaskAccessTarget = {
  taskType: TaskType;
  creatorEmployeeId: string;
  teamId: string | null;
  assigneeEmployeeIds: readonly string[];
};

export type TaskAssigneeSummary = {
  employeeId: string;
  fullName: string;
  status: TaskStatus;
  progress: number;
  blockedReason: string | null;
};

export type TaskSummary = TaskAccessTarget & {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  dueDate: string | null;
  creatorName: string;
  teamName: string | null;
  assigneeNames: string[];
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
};

export type TaskDetail = TaskSummary & {
  description: string | null;
  assignees: TaskAssigneeSummary[];
};

export type TaskValidationCode = "INVALID_TASK_INPUT";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: TaskValidationCode };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function readDate(value: unknown): string | null {
  const candidate = cleanText(value);
  if (!candidate) return null;
  if (!DATE_PATTERN.test(candidate)) return "";

  const date = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== candidate ? "" : candidate;
}

export function validatePersonalTaskInput(input: Record<string, unknown> | null): ValidationResult<PersonalTaskInput> {
  const title = cleanText(input?.title);
  const description = nullableText(input?.description);
  const priority = cleanText(input?.priority).toLowerCase();
  const status = cleanText(input?.status).toLowerCase() || "todo";
  const dueDate = readDate(input?.dueDate);

  if (
    title.length < 2 ||
    title.length > 160 ||
    (description?.length ?? 0) > 2_000 ||
    !TASK_PRIORITIES.includes(priority as TaskPriority) ||
    !TASK_STATUSES.includes(status as TaskStatus) ||
    dueDate === ""
  ) {
    return { ok: false, code: "INVALID_TASK_INPUT" };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      priority: priority as TaskPriority,
      status: status as TaskStatus,
      dueDate,
    },
  };
}

export function isTaskId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasSystemTaskPermission(actor: AuthorizationActor | null, action: PermissionAction): boolean {
  return isAuthorized(actor, action, "task");
}

export function canAccessTaskWorkspace(actor: AuthorizationActor | null): boolean {
  return Boolean(
    actor?.employeeId &&
      actor.accountStatus === "active" &&
      actor.permissions.some((permission) => permission.startsWith("task:read:")),
  );
}

function canAccessAssignedTask(actor: AuthorizationActor | null, target: TaskAccessTarget): boolean {
  const employeeIds = [target.creatorEmployeeId, ...target.assigneeEmployeeIds];

  return (
    employeeIds.some((employeeId) => isAuthorized(actor, "read", "task", { employeeId })) ||
    (target.teamId ? isAuthorized(actor, "read", "task", { teamIds: [target.teamId] }) : false)
  );
}

export function canReadTask(actor: AuthorizationActor | null, target: TaskAccessTarget): boolean {
  if (hasSystemTaskPermission(actor, "read")) {
    return true;
  }

  if (target.taskType === "personal") {
    return Boolean(actor?.employeeId && actor.employeeId === target.creatorEmployeeId && isAuthorized(actor, "read", "task", {
      employeeId: target.creatorEmployeeId,
    }));
  }

  return canAccessAssignedTask(actor, target);
}

export function canCreatePersonalTask(actor: AuthorizationActor | null): boolean {
  return Boolean(actor?.employeeId && isAuthorized(actor, "create", "task", { employeeId: actor.employeeId }));
}

export function canManagePersonalTask(
  actor: AuthorizationActor | null,
  action: Extract<PermissionAction, "update" | "delete">,
  target: TaskAccessTarget,
): boolean {
  if (target.taskType !== "personal") {
    return false;
  }

  if (hasSystemTaskPermission(actor, action)) {
    return true;
  }

  return Boolean(
    actor?.employeeId &&
      actor.employeeId === target.creatorEmployeeId &&
      isAuthorized(actor, action, "task", { employeeId: target.creatorEmployeeId }),
  );
}
