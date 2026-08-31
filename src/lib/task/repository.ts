import "server-only";

import type { CurrentActor } from "@/lib/auth/session";
import { getInsForgeAdminClient } from "@/lib/insforge/admin";

import {
  canDeleteAssignedTask,
  canAssignEmployee,
  canManageAssignment,
  canManagePersonalTask,
  canReadTask,
  canUpdateOwnAssignmentProgress,
  type AssignedTaskInput,
  type AssignmentProgressInput,
  type PersonalTaskInput,
  type TaskAssignmentEmployee,
  type TaskAssignmentOptions,
  type TaskAssignmentTeam,
  type TaskAssigneeSummary,
  TaskAssignmentInputError,
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
  assigner_employee_id: string | null;
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
  employee_code: string | null;
};

type TeamRow = {
  id: string;
  name: string;
};

type AssignmentEmployeeRow = EmployeeRow & {
  account_status: string;
};

type MembershipRow = {
  employee_id: string;
  team_id: string;
};

type TaskRecord = TaskRow & {
  creatorName: string;
  teamName: string | null;
  assignees: TaskAssigneeSummary[];
};

const taskColumns =
  "id, task_type, title, description, creator_employee_id, assigner_employee_id, team_id, priority, status, progress, due_date, updated_at";

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
    client.database.from("employees").select("id, full_name, employee_code").in("id", employeeIds).limit(1_000),
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

  const canManageTask =
    task.task_type === "personal"
      ? canManagePersonalTask(actor, "update", target)
      : canManageAssignment(actor, target);
  const canDeleteTask =
    task.task_type === "personal"
      ? canManagePersonalTask(actor, "delete", target)
      : canDeleteAssignedTask(actor, target);
  const canUpdateOwnProgress = Boolean(
    task.task_type === "assigned" &&
      actor.employeeId &&
      task.assignees.some((assignee) => canUpdateOwnAssignmentProgress(actor, assignee.employeeId)),
  );

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
    ownAssignee: task.assignees.find((assignee) => assignee.employeeId === actor.employeeId) ?? null,
    canEdit: canManageTask,
    canDelete: canDeleteTask,
    canManageAssignment: task.task_type === "assigned" && canManageTask,
    canUpdateOwnProgress,
  };
}

function toTaskSummary(actor: CurrentActor, task: TaskRecord): TaskSummary {
  const target = {
    taskType: task.task_type,
    creatorEmployeeId: task.creator_employee_id,
    teamId: task.team_id,
    assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
  } as const;

  const canEdit =
    task.task_type === "personal"
      ? canManagePersonalTask(actor, "update", target)
      : canManageAssignment(actor, target);
  const canDelete =
    task.task_type === "personal"
      ? canManagePersonalTask(actor, "delete", target)
      : canDeleteAssignedTask(actor, target);

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
    canEdit,
    canDelete,
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

export async function getTaskAssignmentOptions(actor: CurrentActor): Promise<TaskAssignmentOptions> {
  const client = getInsForgeAdminClient();
  const [employeesResult, teamsResult, membershipsResult] = await Promise.all([
    client.database
      .from("employees")
      .select("id, full_name, employee_code, account_status")
      .eq("account_status", "active")
      .order("full_name")
      .limit(1_000),
    client.database.from("teams").select("id, name").eq("is_active", true).order("name").limit(500),
    client.database
      .from("team_memberships")
      .select("employee_id, team_id")
      .eq("is_active", true)
      .limit(3_000),
  ]);

  if (employeesResult.error) throw employeesResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const eligibleEmployees = ((employeesResult.data ?? []) as AssignmentEmployeeRow[]).filter((employee) =>
    canAssignEmployee(actor, employee.id),
  );
  const eligibleEmployeeIds = new Set(eligibleEmployees.map((employee) => employee.id));
  const teams = (teamsResult.data ?? []) as TeamRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const teamIdsByEmployee = new Map<string, string[]>();
  const employeeIdsByTeam = new Map<string, string[]>();

  for (const membership of memberships) {
    teamIdsByEmployee.set(membership.employee_id, [
      ...(teamIdsByEmployee.get(membership.employee_id) ?? []),
      membership.team_id,
    ]);

    if (eligibleEmployeeIds.has(membership.employee_id)) {
      employeeIdsByTeam.set(membership.team_id, [
        ...(employeeIdsByTeam.get(membership.team_id) ?? []),
        membership.employee_id,
      ]);
    }
  }

  const employees: TaskAssignmentEmployee[] = eligibleEmployees.map((employee) => ({
    id: employee.id,
    fullName: employee.full_name,
    employeeCode: employee.employee_code,
    teamNames: (teamIdsByEmployee.get(employee.id) ?? [])
      .map((teamId) => teamNames.get(teamId))
      .filter((name): name is string => Boolean(name)),
  }));
  const assignmentTeams: TaskAssignmentTeam[] = teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      employeeIds: [...new Set(employeeIdsByTeam.get(team.id) ?? [])],
    }))
    .filter((team) => team.employeeIds.length > 0);

  return {
    canAssign: employees.length > 0,
    employees,
    teams: assignmentTeams,
  };
}

async function resolveAssigneeIds(actor: CurrentActor, input: AssignedTaskInput): Promise<string[]> {
  const options = await getTaskAssignmentOptions(actor);
  const selectableEmployeeIds = new Set(options.employees.map((employee) => employee.id));

  if (input.employeeIds.some((employeeId) => !selectableEmployeeIds.has(employeeId))) {
    throw new TaskAssignmentInputError();
  }

  const teamsById = new Map(options.teams.map((team) => [team.id, team]));
  const selectedTeams = input.teamIds.map((teamId) => teamsById.get(teamId));

  if (selectedTeams.some((team) => !team)) {
    throw new TaskAssignmentInputError();
  }

  const teamEmployeeIds = selectedTeams.flatMap((team) => team?.employeeIds ?? []);
  const assigneeIds = [...new Set([...input.employeeIds, ...teamEmployeeIds])];
  if (assigneeIds.length === 0) {
    throw new TaskAssignmentInputError("Select at least one eligible assignee.");
  }

  return assigneeIds;
}

export async function createAssignedTask(
  actor: CurrentActor & { employeeId: string },
  input: AssignedTaskInput,
  requestId: string,
): Promise<TaskDetail> {
  const assigneeIds = await resolveAssigneeIds(actor, input);
  const { data, error } = await getInsForgeAdminClient().database.rpc("create_assigned_task", {
    p_creator_employee_id: actor.employeeId,
    p_team_id: input.teamId,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
    p_due_date: input.dueDate,
    p_assignee_employee_ids: assigneeIds,
    p_request_id: requestId,
  });

  if (error) throw error;
  if (typeof data !== "string") throw new Error("Could not create assigned task.");

  const task = await getAccessibleTask(actor, data);
  if (!task) throw new Error("Could not load assigned task.");

  return task;
}

export async function updateAssignedTask(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  input: AssignedTaskInput,
  requestId: string,
): Promise<TaskDetail | null> {
  const currentTask = await getAccessibleTask(actor, taskId);
  if (!currentTask?.canManageAssignment) return null;

  const assigneeIds = await resolveAssigneeIds(actor, input);
  const { data, error } = await getInsForgeAdminClient().database.rpc("update_assigned_task", {
    p_task_id: taskId,
    p_actor_employee_id: actor.employeeId,
    p_team_id: input.teamId,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
    p_due_date: input.dueDate,
    p_assignee_employee_ids: assigneeIds,
    p_request_id: requestId,
  });

  if (error) throw error;
  if (typeof data !== "string") throw new Error("Could not update assigned task.");

  return getAccessibleTask(actor, data);
}

export async function updateOwnAssignmentProgress(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  input: AssignmentProgressInput,
  requestId: string,
): Promise<TaskDetail | null> {
  const task = await getAccessibleTask(actor, taskId);
  if (!task?.canUpdateOwnProgress) return null;

  const { data, error } = await getInsForgeAdminClient().database.rpc("update_task_assignee_progress", {
    p_task_id: taskId,
    p_employee_id: actor.employeeId,
    p_status: input.status,
    p_progress: input.progress,
    p_blocked_reason: input.blockedReason,
    p_actor_employee_id: actor.employeeId,
    p_request_id: requestId,
  });

  if (error) throw error;
  if (data !== true) return null;

  return getAccessibleTask(actor, taskId);
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
