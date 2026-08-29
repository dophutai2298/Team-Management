import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { authorize } from "@/lib/authorization/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { employeeRouteFailure } from "@/lib/employee/http";
import { validateEmployeeProfileInput, type EmployeeProfile } from "@/lib/employee/profile";
import { getOwnEmployeeProfile, updateOwnEmployeeProfile } from "@/lib/employee/repository";

export const dynamic = "force-dynamic";

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ profile: EmployeeProfile }>>> {
  try {
    const actor = await getCurrentActor();

    if (!actor) {
      authorize(actor, "read", "employee");
    }
    if (!actor.employeeId) {
      return NextResponse.json(apiFailure("PROFILE_NOT_FOUND", "Employee profile was not found."), { status: 404 });
    }
    authorize(actor, "read", "employee", { employeeId: actor.employeeId });

    const profile = await getOwnEmployeeProfile(actor.employeeId);

    if (!profile) {
      return NextResponse.json(apiFailure("PROFILE_NOT_FOUND", "Employee profile was not found."), { status: 404 });
    }

    return NextResponse.json(apiSuccess({ profile }));
  } catch (error) {
    return employeeRouteFailure(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const actor = await getCurrentActor();

    if (!actor) {
      authorize(actor, "update", "employee");
    }
    if (!actor.employeeId) {
      return NextResponse.json(apiFailure("PROFILE_NOT_FOUND", "Employee profile was not found."), { status: 404 });
    }
    authorize(actor, "update", "employee", { employeeId: actor.employeeId });

    const validation = validateEmployeeProfileInput(await readJsonBody(request));

    if (!validation.ok) {
      return NextResponse.json(apiFailure(validation.code, "Invalid employee profile input."), { status: 400 });
    }

    await updateOwnEmployeeProfile(actor.authUserId, validation.value, crypto.randomUUID());

    return NextResponse.json(apiSuccess({ id: actor.employeeId }));
  } catch (error) {
    return employeeRouteFailure(error);
  }
}
