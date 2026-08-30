import "server-only";

import type { CurrentActor } from "@/lib/auth/session";
import { getInsForgeAdminClient } from "@/lib/insforge/admin";

import {
  canManagePersonalTask,
  canReadTask,
  type PersonalTaskInput,
  type TaskAssigneeSummary,
  type TaskDetail,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  type TaskType,
} from "./task";

type TaskRow = {
  id: string;
  task_type: TaskType;
  title: string;
  description: string | null;
  creator_employee_id: string;
  team_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  due_date: string | null;
  updated_at: string;
};

type TaskAssigneeRow = {
  task_id: string;
  employee_id: string;
  status: TaskStatus;
  progress: number;
  blocked_reason: string | null;
};

type EmployeeRow = {
  id: string;
  full_name: string;
};

type TeamRow = {
  id: string;
  name: string;
};

type TaskRecord = TaskRow & {
  creatorName: string;
  teamName: string | null;
  assignees: TaskAssigneeSummary[];
};

const taskColumns =
  "id, task_type, title, description, creator_employee_id, team_id, priority, status, progress, due_date, updated_at";

async function hydrateTasks(rows: TaskRow[]): Promise<TaskRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const client = getInsForgeAdminClient();
  const taskIds = rows.map((row) => row.id);
  const assigneesResult = await client.database
    .from("task_assignees")
    .select("task_id, employee_id, status, progress, blocked_reason")
    .in("task_id", taskIds)
    .limit(2_000);

  if (assigneesResult.error) throw assigneesResult.error;

  const assigneeRows = (assigneesResult.data ?? []) as TaskAssigneeRow[];
  const employeeIds = [...new Set([...rows.map((row) => row.creator_employee_id), ...assigneeRows.map((row) => row.employee_id)])];
  const teamIds = [...new Set(rows.map((row) => row.team_id).filter((teamId): teamId is string => Boolean(teamId)))];
  const [employeesResult, teamsResult] = await Promise.all([
    client.database.from("employees").select("id, full_name").in("id", employeeIds).limit(1_000),
    teamIds.length > 0 ? client.database.from("teams").select("id, name").in("id", teamIds).limit(500) : null,
  ]);

  if (employeesResult.error) throw employeesResult.error;
  if (teamsResult?.error) throw teamsResult.error;

  const employeeNames = new Map(((employeesResult.data ?? []) as EmployeeRow[]).map((employee) => [employee.id, employee.full_name]));
  const teamNames = new Map(((teamsResult?.data ?? []) as TeamRow[]).map((team) => [team.id, team.name]));
  const assigneesByTask = new Map<string, TaskAssigneeSummary[]>();

  for (const assignee of assigneeRows) {
    const taskAssignees = assigneesByTask.get(assignee.task_id) ?? [];
    taskAssignees.push({
      employeeId: assignee.employee_id,
      fullName: employeeNames.get(assignee.employee_id) ?? "Unknown employee",
      status: assignee.status,
      progress: assignee.progress,
      blockedReason: assignee.blocked_reason,
    });
    assigneesByTask.set(assignee.task_id, taskAssignees);
  }

  return rows.map((row) => ({
    ...row,
    creatorName: employeeNames.get(row.creator_employee_id) ?? "Unknown employee",
    teamName: row.team_id ? teamNames.get(row.team_id) ?? null : null,
    assignees: assigneesByTask.get(row.id) ?? [],
  }));
}

function toTaskDetail(actor: CurrentActor, task: TaskRecord): TaskDetail {
  const target = {
    taskType: task.task_type,
    creatorEmployeeId: task.creator_employee_id,
    teamId: task.team_id,
    assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
  } as const;

  return {
    ...target,
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    dueDate: task.due_date,
    creatorName: task.creatorName,
    teamName: task.teamName,
    assigneeNames: task.assignees.map((assignee) => assignee.fullName),
    updatedAt: task.updated_at,
    assignees: task.assignees,
    canEdit: canManagePersonalTask(actor, "update", target),
    canDelete: canManagePersonalTask(actor, "delete", target),
  };
}

function toTaskSummary(actor: CurrentActor, task: TaskRecord): TaskSummary {
  const target = {
    taskType: task.task_type,
    creatorEmployeeId: task.creator_employee_id,
    teamId: task.team_id,
    assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
  } as const;

  return {
    ...target,
    id: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    dueDate: task.due_date,
    creatorName: task.creatorName,
    teamName: task.teamName,
    assigneeNames: task.assignees.map((assignee) => assignee.fullName),
    updatedAt: task.updated_at,
    canEdit: canManagePersonalTask(actor, "update", target),
    canDelete: canManagePersonalTask(actor, "delete", target),
  };
}

export async function listAccessibleTasks(actor: CurrentActor): Promise<TaskSummary[]> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("tasks")
    .select(taskColumns)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);

  if (error) throw error;

  return (await hydrateTasks((data ?? []) as TaskRow[]))
    .filter((task) =>
      canReadTask(actor, {
        taskType: task.task_type,
        creatorEmployeeId: task.creator_employee_id,
        teamId: task.team_id,
        assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
      }),
    )
    .map((task) => toTaskSummary(actor, task));
}

export async function getAccessibleTask(actor: CurrentActor, taskId: string): Promise<TaskDetail | null> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("tasks")
    .select(taskColumns)
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [task] = await hydrateTasks([data as TaskRow]);
  if (!task) return null;

  const target = {
    taskType: task.task_type,
    creatorEmployeeId: task.creator_employee_id,
    teamId: task.team_id,
    assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
  } as const;

  return canReadTask(actor, target) ? toTaskDetail(actor, task) : null;
}

export async function createPersonalTask(actor: CurrentActor, input: PersonalTaskInput): Promise<TaskDetail> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("tasks")
    .insert([
      {
        task_type: "personal",
        title: input.title,
        description: input.description,
        creator_employee_id: actor.employeeId,
        priority: input.priority,
        status: input.status,
        due_date: input.dueDate,
      },
    ])
    .select(taskColumns)
    .single();

  if (error) throw error;

  const [task] = await hydrateTasks([data as TaskRow]);
  if (!task) throw new Error("Could not create task.");

  return toTaskDetail(actor, task);
}

export async function updatePersonalTask(
  actor: CurrentActor,
  taskId: string,
  input: PersonalTaskInput,
): Promise<TaskDetail | null> {
  const task = await getAccessibleTask(actor, taskId);

  if (!task || !task.canEdit) return null;

  const { error } = await getInsForgeAdminClient().database
    .from("tasks")
    .update({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      due_date: input.dueDate,
    })
    .eq("id", taskId);

  if (error) throw error;

  return getAccessibleTask(actor, taskId);
}

export async function deletePersonalTask(actor: CurrentActor, taskId: string): Promise<boolean> {
  const task = await getAccessibleTask(actor, taskId);

  if (!task || !task.canDelete) return false;

  const { error } = await getInsForgeAdminClient().database.from("tasks").delete().eq("id", taskId);

  if (error) throw error;

  return true;
}
