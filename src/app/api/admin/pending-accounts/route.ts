import { NextResponse } from "next/server";

import { requireAdminActor } from "@/lib/admin/access";
import { adminRouteFailure } from "@/lib/admin/http";
import { listPendingAccounts } from "@/lib/admin/repository";
import { apiSuccess, type ApiResponse } from "@/lib/api/response";
import type { PendingAccount } from "@/lib/admin/approval";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<{ accounts: PendingAccount[] }>>> {
  try {
    await requireAdminActor();
    const accounts = await listPendingAccounts();

    return NextResponse.json(apiSuccess({ accounts }));
  } catch (error) {
    return adminRouteFailure(error);
  }
}
