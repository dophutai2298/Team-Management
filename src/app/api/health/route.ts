import { NextResponse } from "next/server";

import type { HealthStatus } from "@/lib/api/health";
import { apiSuccess, type ApiResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export function GET(): NextResponse<ApiResponse<HealthStatus>> {
  return NextResponse.json(
    apiSuccess({
      service: "team-management-bff",
      status: "ready",
      checkedAt: new Date().toISOString(),
    }),
  );
}
