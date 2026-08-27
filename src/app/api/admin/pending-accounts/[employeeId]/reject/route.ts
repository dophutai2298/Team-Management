import { NextResponse, type NextRequest } from "next/server";

import { validateRejectionInput } from "@/lib/admin/approval";
import { requireAdminActor } from "@/lib/admin/access";
import { adminRouteFailure } from "@/lib/admin/http";
import { rejectPendingAccount } from "@/lib/admin/repository";
import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { readJsonBody } from "@/lib/auth/http";

type RouteContext = { params: Promise<{ employeeId: string }> };

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string; accountStatus: "disabled" }>>> {
  const { employeeId } = await context.params;
  const validation = validateRejectionInput(employeeId, await readJsonBody(request));

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid rejection input."), { status: 400 });
  }

  try {
    const actor = await requireAdminActor();
    await rejectPendingAccount(actor.authUserId, employeeId, validation.value, crypto.randomUUID());

    return NextResponse.json(apiSuccess({ id: employeeId, accountStatus: "disabled" }));
  } catch (error) {
    return adminRouteFailure(error);
  }
}
