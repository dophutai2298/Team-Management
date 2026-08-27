import { NextResponse } from "next/server";

import { apiFailure, type ApiResponse } from "@/lib/api/response";

import { AdminAccessError } from "./access";

export function adminRouteFailure(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AdminAccessError) {
    return NextResponse.json(apiFailure(error.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", error.message), {
      status: error.status,
    });
  }

  const databaseCode =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  if (databaseCode === "23505") {
    return NextResponse.json(apiFailure("EMPLOYEE_CODE_IN_USE", "Employee code already exists."), { status: 409 });
  }

  if (databaseCode === "P0002") {
    return NextResponse.json(apiFailure("ACCOUNT_NOT_PENDING", "The account is no longer pending approval."), {
      status: 409,
    });
  }

  if (databaseCode === "22023") {
    return NextResponse.json(apiFailure("INVALID_APPROVAL_INPUT", "Invalid approval input."), { status: 400 });
  }

  if (databaseCode === "23503") {
    return NextResponse.json(
      apiFailure("INVALID_ORGANIZATION_ASSIGNMENT", "The selected organization assignment is no longer valid."),
      { status: 409 },
    );
  }

  return NextResponse.json(
    apiFailure("ADMIN_OPERATION_FAILED", "We could not complete this administrative operation. Please try again."),
    { status: 503 },
  );
}
