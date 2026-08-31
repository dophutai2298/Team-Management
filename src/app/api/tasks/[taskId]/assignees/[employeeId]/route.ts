import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { taskRouteFailure } from "@/lib/task/http";
import {
  canAccessTaskWorkspace,
  isTaskId,
  validateAssignmentProgressInput,
  type TaskDetail,
} from "@/lib/task/task";
import { updateOwnAssignmentProgress } from "@/lib/task/repository";

type RouteContext = { params: Promise<{ taskId: string; employeeId: string }> };

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireTaskActor(): Promise<CurrentActor & { employeeId: string }> {
  const actor = await getCurrentActor();

  if (!actor) throw new AuthorizationError("UNAUTHENTICATED", 401);
  if (!actor.employeeId) throw new AuthorizationError("FORBIDDEN", 403);

  return actor as CurrentActor & { employeeId: string };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const { employeeId, taskId } = await context.params;
  if (!isTaskId(taskId) || !isTaskId(employeeId)) {
    return NextResponse.json(apiFailure("INVALID_TASK_ID", "Invalid task or employee identifier."), { status: 400 });
  }

  const validation = validateAssignmentProgressInput(await readJsonBody(request));
  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid task progress input."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor) || actor.employeeId !== employeeId) {
      throw new AuthorizationError("FORBIDDEN", 403);
    }

    const task = await updateOwnAssignmentProgress(actor, taskId, validation.value, crypto.randomUUID());
    return task
      ? NextResponse.json(apiSuccess({ task }))
      : NextResponse.json(apiFailure("TASK_NOT_FOUND", "The assigned task could not be found."), { status: 404 });
  } catch (error) {
    return taskRouteFailure(error);
  }
}
