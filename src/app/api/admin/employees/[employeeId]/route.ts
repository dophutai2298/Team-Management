import { NextResponse } from "next/server";

import { requireAdminActor } from "@/lib/admin/access";
import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { authorize } from "@/lib/authorization/authorization";
import { employeeRouteFailure } from "@/lib/employee/http";
import { validateAdminEmployeeInput } from "@/lib/employee/profile";
import { updateManagedEmployee } from "@/lib/employee/repository";

type RouteContext = { params: Promise<{ employeeId: string }> };

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const { employeeId } = await context.params;
  const validation = validateAdminEmployeeInput(employeeId, await readJsonBody(request));

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid employee management input."), { status: 400 });
  }

  try {
    const actor = await requireAdminActor();
    authorize(actor, "update", "employee", { employeeId });
    await updateManagedEmployee(actor.authUserId, employeeId, validation.value, crypto.randomUUID());

    return NextResponse.json(apiSuccess({ id: employeeId }));
  } catch (error) {
    return employeeRouteFailure(error);
  }
}
