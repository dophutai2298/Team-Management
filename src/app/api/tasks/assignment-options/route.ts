import { NextResponse } from "next/server";

import { apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";
import { taskRouteFailure } from "@/lib/task/http";
import { canAccessTaskWorkspace, type TaskAssignmentOptions } from "@/lib/task/task";
import { getTaskAssignmentOptions } from "@/lib/task/repository";

export const dynamic = "force-dynamic";

async function requireTaskActor(): Promise<CurrentActor & { employeeId: string }> {
  const actor = await getCurrentActor();

  if (!actor) throw new AuthorizationError("UNAUTHENTICATED", 401);
  if (!actor.employeeId) throw new AuthorizationError("FORBIDDEN", 403);

  return actor as CurrentActor & { employeeId: string };
}

export async function GET(): Promise<NextResponse<ApiResponse<TaskAssignmentOptions>>> {
  try {
    const actor = await requireTaskActor();
    if (!canAccessTaskWorkspace(actor)) throw new AuthorizationError("FORBIDDEN", 403);

    return NextResponse.json(apiSuccess(await getTaskAssignmentOptions(actor)));
  } catch (error) {
    return taskRouteFailure(error);
  }
}
