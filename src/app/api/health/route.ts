import { NextResponse } from "next/server";

import type { HealthStatus } from "@/lib/api/health";
import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { checkInsForgeBackendHealth } from "@/lib/insforge/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<HealthStatus>>> {
  const checkedAt = new Date().toISOString();

  try {
    const backend = await checkInsForgeBackendHealth();

    return NextResponse.json(
      apiSuccess({
        service: "team-management-bff",
        status: "ready",
        checkedAt,
        backend,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown InsForge health check error.";

    return NextResponse.json(
      apiFailure("INSFORGE_UNAVAILABLE", "The configured InsForge backend is not reachable.", {
        checkedAt,
        message,
      }),
      { status: 503 },
    );
  }
}
