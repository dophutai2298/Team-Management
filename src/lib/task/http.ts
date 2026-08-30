import { NextResponse } from "next/server";

import { apiFailure, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";

export function taskRouteFailure(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(apiFailure(error.code, error.message), { status: error.status });
  }

  return NextResponse.json(
    apiFailure("TASK_OPERATION_FAILED", "We could not complete this task operation. Please try again."),
    { status: 503 },
  );
}
