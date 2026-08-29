import { NextResponse } from "next/server";

import { apiFailure, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";

export function employeeRouteFailure(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(apiFailure(error.code, error.message), { status: error.status });
  }

  const databaseCode =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  if (databaseCode === "23505") {
    return NextResponse.json(apiFailure("EMPLOYEE_CODE_IN_USE", "Employee code already exists."), { status: 409 });
  }

  if (databaseCode === "42501") {
    return NextResponse.json(apiFailure("FORBIDDEN", "You do not have permission to perform this action."), {
      status: 403,
    });
  }

  if (databaseCode === "P0002") {
    return NextResponse.json(apiFailure("EMPLOYEE_NOT_MANAGEABLE", "This employee cannot be managed here."), {
      status: 409,
    });
  }

  if (databaseCode === "22023") {
    return NextResponse.json(apiFailure("INVALID_EMPLOYEE_INPUT", "Invalid employee input."), { status: 400 });
  }

  if (databaseCode === "23503") {
    return NextResponse.json(
      apiFailure("INVALID_ORGANIZATION_ASSIGNMENT", "The selected organization assignment is no longer valid."),
      { status: 409 },
    );
  }

  return NextResponse.json(
    apiFailure("EMPLOYEE_OPERATION_FAILED", "We could not complete this employee operation. Please try again."),
    { status: 503 },
  );
}
