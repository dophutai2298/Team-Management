import "server-only";

import type { CurrentActor } from "@/lib/auth/session";
import { getInsForgeAdminClient } from "@/lib/insforge/admin";
import { isOptionalTaskCollaborationSchemaError } from "@/lib/task/collaboration-errors";

import {
  canDeleteAssignedTask,
  canAssignEmployee,
  canManageAssignment,
  canManagePersonalTask,
  canReadTask,
  canRemoveTaskAttachment,
  canUpdateOwnAssignmentProgress,
  type AssignedTaskInput,
  type AssignmentProgressInput,
  type PersonalTaskInput,
  TASK_ATTACHMENT_BUCKET,
  type TaskAssignmentEmployee,
  type TaskAssignmentOptions,
  type TaskAssignmentTeam,
  type TaskAssigneeSummary,
  type TaskAttachment,
  type TaskAttachmentUploadInput,
  type TaskComment,
  type TaskCommentInput,
  type TaskActivity,
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

type TaskCommentRow = {
  id: string;
  author_employee_id: string;
  body: string;
  created_at: string;
};

type TaskAttachmentRow = {
  id: string;
  uploader_employee_id: string;
  bucket_name: string;
  storage_key: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  created_at: string;
  removed_at: string | null;
};

type TaskAuditRow = {
  id: string;
  actor_employee_id: string | null;
  action: string;
  created_at: string;
};

type TaskCollaboration = {
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activity: TaskActivity[];
};

const taskColumns =
  "id, task_type, title, description, creator_employee_id, assigner_employee_id, team_id, priority, status, progress, due_date, updated_at";
const taskCommentColumns = "id, author_employee_id, body, created_at";
const taskAttachmentColumns =
  "id, uploader_employee_id, bucket_name, storage_key, file_name, content_type, file_size_bytes, created_at, removed_at";
const taskAuditColumns = "id, actor_employee_id, action, created_at";

const emptyCollaboration: TaskCollaboration = {
  comments: [],
  attachments: [],
  activity: [],
};

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

async function hydrateTaskCollaboration(actor: CurrentActor, task: TaskRecord): Promise<TaskCollaboration> {
  const client = getInsForgeAdminClient();
  let collaborationResults;

  try {
    collaborationResults = await Promise.all([
      client.database
        .from("task_comments")
        .select(taskCommentColumns)
        .eq("task_id", task.id)
        .order("created_at", { ascending: true })
        .limit(200),
      client.database
        .from("task_attachments")
        .select(taskAttachmentColumns)
        .eq("task_id", task.id)
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
      client.database
        .from("account_audit_events")
        .select(taskAuditColumns)
        .eq("resource", "task")
        .eq("resource_id", task.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
  } catch (error) {
    if (isOptionalTaskCollaborationSchemaError(error)) {
      return emptyCollaboration;
    }

    return emptyCollaboration;
  }
  const collaborationError = collaborationResults.find((result) => result.error)?.error;

  if (collaborationError) {
    if (isOptionalTaskCollaborationSchemaError(collaborationError)) {
      return emptyCollaboration;
    }

    return emptyCollaboration;
  }

  const [commentsResult, attachmentsResult, activityResult] = collaborationResults;

  const commentRows = (commentsResult.data ?? []) as TaskCommentRow[];
  const attachmentRows = (attachmentsResult.data ?? []) as TaskAttachmentRow[];
  const activityRows = (activityResult.data ?? []) as TaskAuditRow[];
  const employeeIds = [
    ...new Set(
      [
        ...commentRows.map((comment) => comment.author_employee_id),
        ...attachmentRows.map((attachment) => attachment.uploader_employee_id),
        ...activityRows.map((activity) => activity.actor_employee_id).filter((id): id is string => Boolean(id)),
      ],
    ),
  ];
  const employeesResult = employeeIds.length
    ? await client.database.from("employees").select("id, full_name, employee_code").in("id", employeeIds).limit(1_000)
    : null;

  if (employeesResult?.error) return emptyCollaboration;

  const employeeNames = new Map(((employeesResult?.data ?? []) as EmployeeRow[]).map((employee) => [employee.id, employee.full_name]));
  const target = {
    taskType: task.task_type,
    creatorEmployeeId: task.creator_employee_id,
    teamId: task.team_id,
    assigneeEmployeeIds: task.assignees.map((assignee) => assignee.employeeId),
  } as const;

  return {
    comments: commentRows.map((comment) => ({
      id: comment.id,
      authorEmployeeId: comment.author_employee_id,
      authorName: employeeNames.get(comment.author_employee_id) ?? "Unknown employee",
      body: comment.body,
      createdAt: comment.created_at,
    })),
    attachments: attachmentRows.map((attachment) => ({
      id: attachment.id,
      uploaderEmployeeId: attachment.uploader_employee_id,
      uploaderName: employeeNames.get(attachment.uploader_employee_id) ?? "Unknown employee",
      fileName: attachment.file_name,
      contentType: attachment.content_type,
      fileSizeBytes: attachment.file_size_bytes,
      createdAt: attachment.created_at,
      canRemove: canRemoveTaskAttachment(actor, target, attachment.uploader_employee_id),
    })),
    activity: activityRows.map((activity) => ({
      id: activity.id,
      actorEmployeeId: activity.actor_employee_id,
      actorName: activity.actor_employee_id
        ? employeeNames.get(activity.actor_employee_id) ?? "Unknown employee"
        : "System",
      action: activity.action,
      createdAt: activity.created_at,
    })),
  };
}

function toTaskDetail(actor: CurrentActor, task: TaskRecord, collaboration: TaskCollaboration = emptyCollaboration): TaskDetail {
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
    comments: collaboration.comments,
    attachments: collaboration.attachments,
    activity: collaboration.activity,
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

  if (!canReadTask(actor, target)) return null;

  return toTaskDetail(actor, task, await hydrateTaskCollaboration(actor, task));
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

function sanitizeStorageFileName(fileName: string): string {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const baseName = fileName
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "attachment"}${extension}`;
}

function taskAttachmentKey(taskId: string, attachmentId: string, fileName: string): string {
  return `tasks/${taskId}/${attachmentId}-${sanitizeStorageFileName(fileName)}`;
}

async function insertTaskAuditEvent(
  actor: CurrentActor & { employeeId: string },
  action: string,
  taskId: string,
  afterData: Record<string, unknown>,
  requestId: string,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.from("account_audit_events").insert([
    {
      actor_type: "user",
      actor_employee_id: actor.employeeId,
      action,
      resource: "task",
      resource_id: taskId,
      after_data: afterData,
      request_id: requestId,
    },
  ]);

  if (error) throw error;
}

export async function createTaskComment(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  input: TaskCommentInput,
  requestId: string,
): Promise<TaskDetail | null> {
  const task = await getAccessibleTask(actor, taskId);
  if (!task) return null;

  const client = getInsForgeAdminClient();
  const { error } = await client.database.from("task_comments").insert([
    {
      task_id: taskId,
      author_employee_id: actor.employeeId,
      body: input.body,
    },
  ]);

  if (error) throw error;

  await insertTaskAuditEvent(actor, "task.comment_created", taskId, { bodyLength: input.body.length }, requestId);

  return getAccessibleTask(actor, taskId);
}

export async function createTaskAttachment(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  file: File | Blob,
  input: TaskAttachmentUploadInput,
  requestId: string,
): Promise<TaskDetail | null> {
  const task = await getAccessibleTask(actor, taskId);
  if (!task) return null;

  const client = getInsForgeAdminClient();
  const attachmentId = crypto.randomUUID();
  const storageKey = taskAttachmentKey(taskId, attachmentId, input.fileName);
  const uploadFile =
    file.type === input.contentType ? file : new Blob([await file.arrayBuffer()], { type: input.contentType });
  const uploadResult = await client.storage.from(TASK_ATTACHMENT_BUCKET).upload(storageKey, uploadFile);

  if (uploadResult.error) throw uploadResult.error;

  const { error } = await client.database.from("task_attachments").insert([
    {
      id: attachmentId,
      task_id: taskId,
      uploader_employee_id: actor.employeeId,
      bucket_name: TASK_ATTACHMENT_BUCKET,
      storage_key: storageKey,
      storage_url: uploadResult.data?.url ?? null,
      file_name: input.fileName,
      content_type: input.contentType,
      file_size_bytes: input.fileSizeBytes,
    },
  ]);

  if (error) {
    try {
      await client.storage.from(TASK_ATTACHMENT_BUCKET).remove(storageKey);
    } catch {
      // Preserve the metadata insert failure; cleanup can be retried from storage tooling if needed.
    }
    throw error;
  }

  await insertTaskAuditEvent(
    actor,
    "task.attachment_uploaded",
    taskId,
    { attachmentId, fileName: input.fileName, fileSizeBytes: input.fileSizeBytes },
    requestId,
  );

  return getAccessibleTask(actor, taskId);
}

export async function downloadTaskAttachment(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  attachmentId: string,
): Promise<{ attachment: TaskAttachmentRow; blob: Blob } | null> {
  const task = await getAccessibleTask(actor, taskId);
  if (!task) return null;

  const client = getInsForgeAdminClient();
  const { data, error } = await client.database
    .from("task_attachments")
    .select(taskAttachmentColumns)
    .eq("id", attachmentId)
    .eq("task_id", taskId)
    .is("removed_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const attachment = data as TaskAttachmentRow;
  const downloadResult = await client.storage.from(attachment.bucket_name).download(attachment.storage_key);
  if (downloadResult.error) throw downloadResult.error;
  if (!downloadResult.data) return null;

  return { attachment, blob: downloadResult.data };
}

export async function removeTaskAttachment(
  actor: CurrentActor & { employeeId: string },
  taskId: string,
  attachmentId: string,
  requestId: string,
): Promise<TaskDetail | null> {
  const task = await getAccessibleTask(actor, taskId);
  if (!task) return null;

  const client = getInsForgeAdminClient();
  const { data, error } = await client.database
    .from("task_attachments")
    .select(taskAttachmentColumns)
    .eq("id", attachmentId)
    .eq("task_id", taskId)
    .is("removed_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const attachment = data as TaskAttachmentRow;
  const target = {
    taskType: task.taskType,
    creatorEmployeeId: task.creatorEmployeeId,
    teamId: task.teamId,
    assigneeEmployeeIds: task.assigneeEmployeeIds,
  } as const;

  if (!canRemoveTaskAttachment(actor, target, attachment.uploader_employee_id)) {
    return null;
  }

  const removeResult = await client.storage.from(attachment.bucket_name).remove(attachment.storage_key);
  if (removeResult.error) throw removeResult.error;

  const updateResult = await client.database
    .from("task_attachments")
    .update({ removed_at: new Date().toISOString(), removed_by_employee_id: actor.employeeId })
    .eq("id", attachmentId);

  if (updateResult.error) throw updateResult.error;

  await insertTaskAuditEvent(
    actor,
    "task.attachment_removed",
    taskId,
    { attachmentId, fileName: attachment.file_name },
    requestId,
  );

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

async function listTaskAttachmentStorageObjects(taskId: string): Promise<Pick<TaskAttachmentRow, "bucket_name" | "storage_key">[]> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("task_attachments")
    .select("bucket_name, storage_key")
    .eq("task_id", taskId)
    .is("removed_at", null)
    .limit(500);

  if (error) {
    if (isOptionalTaskCollaborationSchemaError(error)) {
      return [];
    }

    throw error;
  }

  return (data ?? []) as Pick<TaskAttachmentRow, "bucket_name" | "storage_key">[];
}

async function removeTaskAttachmentObjects(taskId: string): Promise<void> {
  const attachments = await listTaskAttachmentStorageObjects(taskId);
  const storageKeysByBucket = new Map<string, string[]>();

  for (const attachment of attachments) {
    storageKeysByBucket.set(attachment.bucket_name, [
      ...(storageKeysByBucket.get(attachment.bucket_name) ?? []),
      attachment.storage_key,
    ]);
  }

  await Promise.all(
    [...storageKeysByBucket.entries()].map(async ([bucketName, storageKeys]) => {
      if (storageKeys.length === 0) return;

      try {
        await getInsForgeAdminClient().storage.from(bucketName).remove(storageKeys);
      } catch {
        // Do not block task deletion if an attachment object was already removed outside the app.
      }
    }),
  );
}

export async function deleteTask(actor: CurrentActor, taskId: string): Promise<boolean> {
  const task = await getAccessibleTask(actor, taskId);

  if (!task || !task.canDelete) return false;

  await removeTaskAttachmentObjects(taskId);

  const { error } = await getInsForgeAdminClient().database.from("tasks").delete().eq("id", taskId);

  if (error) throw error;

  return true;
}

export const deletePersonalTask = deleteTask;
