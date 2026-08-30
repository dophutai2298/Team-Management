import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { AuthorizationError } from "@/lib/authorization/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { organizationRouteFailure } from "@/lib/organization/http";
import { getOrganizationView } from "@/lib/organization/repository";
import type { OrganizationView } from "@/lib/organization/organization";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<OrganizationView>>> {
  try {
    const actor = await getCurrentActor();

    if (!actor) {
      throw new AuthorizationError("UNAUTHENTICATED", 401);
    }

    const view = await getOrganizationView(actor);

    if (!view) {
      return NextResponse.json(
        apiFailure("FORBIDDEN", "You do not have permission to view this organization."),
        { status: 403 },
      );
    }

    return NextResponse.json(apiSuccess(view));
  } catch (error) {
    return organizationRouteFailure(error);
  }
}
