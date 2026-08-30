import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError, authorize } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { taskRouteFailure } from "@/lib/task/http";
import { canAccessTaskWorkspace, canCreatePersonalTask, validatePersonalTaskInput, type TaskDetail, type TaskSummary } from "@/lib/task/task";
import { createPersonalTask, listAccessibleTasks } from "@/lib/task/repository";

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

  if (!actor) {
    throw new AuthorizationError("UNAUTHENTICATED", 401);
  }
  if (!actor.employeeId) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }

  return actor as CurrentActor & { employeeId: string };
}

export async function GET(): Promise<NextResponse<ApiResponse<{ tasks: TaskSummary[] }>>> {
  try {
    const actor = await requireTaskActor();

    if (!canAccessTaskWorkspace(actor)) {
      throw new AuthorizationError("FORBIDDEN", 403);
    }

    return NextResponse.json(apiSuccess({ tasks: await listAccessibleTasks(actor) }));
  } catch (error) {
    return taskRouteFailure(error);
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ task: TaskDetail }>>> {
  const validation = validatePersonalTaskInput(await readJsonBody(request));

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid personal task input."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();

    if (!canCreatePersonalTask(actor)) {
      authorize(actor, "create", "task", { employeeId: actor.employeeId });
    }

    return NextResponse.json(apiSuccess({ task: await createPersonalTask(actor, validation.value) }), { status: 201 });
  } catch (error) {
    return taskRouteFailure(error);
  }
}
