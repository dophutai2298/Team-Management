import { NextResponse } from "next/server";

import type { ApprovalOptions } from "@/lib/admin/approval";
import { requireAdminActor } from "@/lib/admin/access";
import { adminRouteFailure } from "@/lib/admin/http";
import { getApprovalOptions } from "@/lib/admin/repository";
import { apiSuccess, type ApiResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<ApprovalOptions>>> {
  try {
    await requireAdminActor();
    return NextResponse.json(apiSuccess(await getApprovalOptions()));
  } catch (error) {
    return adminRouteFailure(error);
  }
}
