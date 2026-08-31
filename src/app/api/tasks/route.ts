import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError, authorize } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { taskRouteFailure } from "@/lib/task/http";
import {
  canAccessTaskWorkspace,
  canCreatePersonalTask,
  validateAssignedTaskInput,
  validatePersonalTaskInput,
  type AssignedTaskInput,
  type PersonalTaskInput,
  type TaskDetail,
  type TaskSummary,
} from "@/lib/task/task";
import { createAssignedTask, createPersonalTask, getTaskAssignmentOptions, listAccessibleTasks } from "@/lib/task/repository";

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
  const input = await readJsonBody(request);
  const isAssignedTask = input?.taskType === "assigned";
  const validation = isAssignedTask ? validateAssignedTaskInput(input) : validatePersonalTaskInput(input);

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid task input."), { status: 400 });
  }

  try {
    const actor = await requireTaskActor();

    if (isAssignedTask) {
      const options = await getTaskAssignmentOptions(actor);
      if (!options.canAssign) {
        throw new AuthorizationError("FORBIDDEN", 403);
      }

      return NextResponse.json(
        apiSuccess({ task: await createAssignedTask(actor, validation.value as AssignedTaskInput, crypto.randomUUID()) }),
        { status: 201 },
      );
    }

    if (!canCreatePersonalTask(actor)) {
      authorize(actor, "create", "task", { employeeId: actor.employeeId });
    }

    return NextResponse.json(apiSuccess({ task: await createPersonalTask(actor, validation.value as PersonalTaskInput) }), { status: 201 });
  } catch (error) {
    return taskRouteFailure(error);
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: { Allow: "GET, POST, OPTIONS" } });
}
