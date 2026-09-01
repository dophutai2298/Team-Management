import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { taskRouteFailure } from "@/lib/task/http";
import {
  canAccessTaskWorkspace,
  isTaskId,
  validateAssignedTaskInput,
  validatePersonalTaskInput,
  type TaskDetail,
  type AssignedTaskInput,
  type PersonalTaskInput,
} from "@/lib/task/task";
import { deleteTask, getAccessibleTask, updateAssignedTask, updatePersonalTask } from "@/lib/task/repository";

type RouteContext = { params: Promise<{ taskId: string }> };

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireTaskActor(): Promise<CurrentActor & { employeeId: string }> {
  const actor = await getCurrentActor();

  if (!actor) {
    throw new AuthorizationError("UNAUTHENTICATED", 401);
  }
  if (!actor.employeeId) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }

  return actor as CurrentActor & { employeeId: string };
}

function invalidTaskIdResponse<T>(): NextResponse<ApiResponse<T>> {
  return NextResponse.json(apiFailure("INVALID_TASK_ID", "Invalid task identifier."), { status: 400 });
}

function taskNotFoundResponse<T>(): NextResponse<ApiResponse<T>> {
  return NextResponse.json(apiFailure("TASK_NOT_FOUND", "The task could not be found."), { status: 404 });
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const { taskId } = await context.params;

  if (!isTaskId(taskId)) return invalidTaskIdResponse<{ task: TaskDetail }>();

  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor)) throw new AuthorizationError("FORBIDDEN", 403);
    const task = await getAccessibleTask(actor, taskId);

    return task ? NextResponse.json(apiSuccess({ task })) : taskNotFoundResponse<{ task: TaskDetail }>();
  } catch (error) {
    return taskRouteFailure(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const { taskId } = await context.params;

  if (!isTaskId(taskId)) return invalidTaskIdResponse<{ task: TaskDetail }>();

  const input = await readJsonBody(request);
  const isAssignedTask = input?.taskType === "assigned";
  const validation = isAssignedTask ? validateAssignedTaskInput(input) : validatePersonalTaskInput(input);
  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid task input."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();
    const task = isAssignedTask
      ? await updateAssignedTask(actor, taskId, validation.value as AssignedTaskInput, crypto.randomUUID())
      : await updatePersonalTask(actor, taskId, validation.value as PersonalTaskInput);

    return task ? NextResponse.json(apiSuccess({ task })) : taskNotFoundResponse<{ task: TaskDetail }>();
  } catch (error) {
    return taskRouteFailure(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const { taskId } = await context.params;

  if (!isTaskId(taskId)) return invalidTaskIdResponse<{ id: string }>();

  try {
    const deleted = await deleteTask(await requireTaskActor(), taskId);

    return deleted ? NextResponse.json(apiSuccess({ id: taskId })) : taskNotFoundResponse<{ id: string }>();
  } catch (error) {
    return taskRouteFailure(error);
  }
}
