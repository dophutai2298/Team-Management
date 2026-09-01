import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { createTaskComment } from "@/lib/task/repository";
import { taskRouteFailure } from "@/lib/task/http";
import { canAccessTaskWorkspace, isTaskId, validateTaskCommentInput, type TaskDetail } from "@/lib/task/task";

type RouteContext = { params: Promise<{ taskId: string }> };

export const dynamic = "force-dynamic";

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

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const { taskId } = await context.params;

  if (!isTaskId(taskId)) {
    return NextResponse.json(apiFailure("INVALID_TASK_ID", "Invalid task identifier."), { status: 400 });
  }

  const validation = validateTaskCommentInput(await readJsonBody(request));
  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Enter a comment before posting."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor)) throw new AuthorizationError("FORBIDDEN", 403);

    const task = await createTaskComment(actor, taskId, validation.value, crypto.randomUUID());

    return task
      ? NextResponse.json(apiSuccess({ task }), { status: 201 })
      : NextResponse.json(apiFailure("TASK_NOT_FOUND", "The task could not be found."), { status: 404 });
  } catch (error) {
    return taskRouteFailure(error);
  }
}

