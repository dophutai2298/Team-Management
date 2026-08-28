import { NextResponse, type NextRequest } from "next/server";

import { validateApprovalInput } from "@/lib/admin/approval";
import { requireAdminActor } from "@/lib/admin/access";
import { adminRouteFailure } from "@/lib/admin/http";
import { approvePendingAccount } from "@/lib/admin/repository";
import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { readJsonBody } from "@/lib/auth/http";

type RouteContext = { params: Promise<{ employeeId: string }> };

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ id: string; accountStatus: "active" }>>> {
  const { employeeId } = await context.params;
  const validation = validateApprovalInput(employeeId, await readJsonBody(request));

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid approval input."), { status: 400 });
  }

  try {
    const actor = await requireAdminActor();
    await approvePendingAccount(actor.authUserId, employeeId, validation.value, crypto.randomUUID());

    return NextResponse.json(apiSuccess({ id: employeeId, accountStatus: "active" }));
  } catch (error) {
    return adminRouteFailure(error);
  }
}
