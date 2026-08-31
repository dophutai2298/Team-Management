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

export type AssignedTaskInput = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  employeeIds: string[];
  teamIds: string[];
  teamId: string | null;
};

export type AssignmentProgressInput = {
  status: TaskStatus;
  progress: number;
  blockedReason: string | null;
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

export type TaskAssignmentEmployee = {
  id: string;
  fullName: string;
  employeeCode: string | null;
  teamNames: string[];
};

export type TaskAssignmentTeam = {
  id: string;
  name: string;
  employeeIds: string[];
};

export type TaskAssignmentOptions = {
  canAssign: boolean;
  employees: TaskAssignmentEmployee[];
  teams: TaskAssignmentTeam[];
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
  ownAssignee: TaskAssigneeSummary | null;
  canManageAssignment: boolean;
  canUpdateOwnProgress: boolean;
};

export type TaskValidationCode = "INVALID_TASK_INPUT";

export class TaskAssignmentInputError extends Error {
  constructor(message = "The selected task assignees are no longer available.") {
    super(message);
    this.name = "TaskAssignmentInputError";
  }
}

type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: TaskValidationCode };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function readUuidList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return [];

  const ids = value.map(cleanText);
  if (ids.some((id) => !UUID_PATTERN.test(id))) return null;

  return [...new Set(ids)];
}

function readOptionalUuid(value: unknown): string | null | undefined {
  const candidate = cleanText(value);
  if (!candidate) return null;
  return UUID_PATTERN.test(candidate) ? candidate : undefined;
}

export function validateAssignedTaskInput(input: Record<string, unknown> | null): ValidationResult<AssignedTaskInput> {
  const title = cleanText(input?.title);
  const description = nullableText(input?.description);
  const priority = cleanText(input?.priority).toLowerCase();
  const dueDate = readDate(input?.dueDate);
  const employeeIds = readUuidList(input?.employeeIds);
  const teamIds = readUuidList(input?.teamIds);
  const legacyTeamId = readOptionalUuid(input?.teamId);
  const normalizedTeamIds = teamIds && teamIds.length > 0 ? teamIds : legacyTeamId ? [legacyTeamId] : [];
  const teamId = normalizedTeamIds[0] ?? null;

  if (
    title.length < 2 ||
    title.length > 160 ||
    (description?.length ?? 0) > 2_000 ||
    !TASK_PRIORITIES.includes(priority as TaskPriority) ||
    dueDate === "" ||
    employeeIds === null ||
    teamIds === null ||
    legacyTeamId === undefined ||
    (employeeIds.length === 0 && normalizedTeamIds.length === 0)
  ) {
    return { ok: false, code: "INVALID_TASK_INPUT" };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      priority: priority as TaskPriority,
      dueDate,
      employeeIds,
      teamIds: normalizedTeamIds,
      teamId,
    },
  };
}

export function validateAssignmentProgressInput(
  input: Record<string, unknown> | null,
): ValidationResult<AssignmentProgressInput> {
  const status = cleanText(input?.status).toLowerCase();
  const rawProgress = input?.progress;
  const progress = typeof rawProgress === "number" ? rawProgress : Number(cleanText(rawProgress));
  const blockedReason = nullableText(input?.blockedReason);

  if (
    !TASK_STATUSES.includes(status as TaskStatus) ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    (blockedReason?.length ?? 0) > 1_000 ||
    (status === "blocked" && (blockedReason?.length ?? 0) < 3)
  ) {
    return { ok: false, code: "INVALID_TASK_INPUT" };
  }

  return {
    ok: true,
    value: {
      status: status as TaskStatus,
      progress: status === "done" ? 100 : progress,
      blockedReason: status === "blocked" ? blockedReason : null,
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

export function canAssignEmployee(actor: AuthorizationActor | null, employeeId: string): boolean {
  return isAuthorized(actor, "assign", "task", { employeeId });
}

export function canManageAssignment(actor: AuthorizationActor | null, target: TaskAccessTarget): boolean {
  if (target.taskType !== "assigned" || target.assigneeEmployeeIds.length === 0) {
    return false;
  }

  return target.assigneeEmployeeIds.every((employeeId) => isAuthorized(actor, "update", "task", { employeeId }));
}

export function canDeleteAssignedTask(actor: AuthorizationActor | null, target: TaskAccessTarget): boolean {
  if (target.taskType !== "assigned" || target.assigneeEmployeeIds.length === 0) {
    return false;
  }

  return target.assigneeEmployeeIds.every((employeeId) => isAuthorized(actor, "delete", "task", { employeeId }));
}

export function canUpdateOwnAssignmentProgress(actor: AuthorizationActor | null, employeeId: string): boolean {
  return Boolean(actor?.employeeId === employeeId && isAuthorized(actor, "update", "task", { employeeId }));
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
