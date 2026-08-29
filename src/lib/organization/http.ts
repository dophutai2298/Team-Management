import { NextResponse } from "next/server";

import { apiFailure, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";

export function organizationRouteFailure(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(apiFailure(error.code, error.message), { status: error.status });
  }

  const databaseCode =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  if (databaseCode === "42501") {
    return NextResponse.json(apiFailure("FORBIDDEN", "You do not have permission to view this organization."), {
      status: 403,
    });
  }

  if (databaseCode === "23505") {
    return NextResponse.json(apiFailure("TEAM_ALREADY_EXISTS", "A team with this name or code already exists."), {
      status: 409,
    });
  }

  if (databaseCode === "23503") {
    return NextResponse.json(apiFailure("INVALID_TEAM_PARENT", "The selected parent team is not valid."), {
      status: 409,
    });
  }

  if (databaseCode === "22023") {
    return NextResponse.json(apiFailure("INVALID_TEAM_INPUT", "Invalid team input."), { status: 400 });
  }

  return NextResponse.json(
    apiFailure("ORGANIZATION_LOAD_FAILED", "We could not load the organization view. Please try again."),
    { status: 503 },
  );
}
