import { NextResponse, type NextRequest } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { requireAuthorizedActor } from "@/lib/authorization/access";
import { organizationRouteFailure } from "@/lib/organization/http";
import { createManagedTeam, listManagedTeams } from "@/lib/organization/repository";
import { validateTeamManagementInput, type ManagedTeam } from "@/lib/organization/team-management";

export const dynamic = "force-dynamic";

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<{ teams: ManagedTeam[] }>>> {
  try {
    await requireAuthorizedActor("read", "team", { teamIds: ["admin"] });

    return NextResponse.json(apiSuccess({ teams: await listManagedTeams() }));
  } catch (error) {
    return organizationRouteFailure(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ team: ManagedTeam }>>> {
  const validation = validateTeamManagementInput(await readJsonBody(request));

  if (!validation.ok) {
    return NextResponse.json(apiFailure(validation.code, "Invalid team input."), { status: 400 });
  }

  try {
    const actor = await requireAuthorizedActor("create", "team");
    const team = await createManagedTeam(actor.authUserId, validation.value, crypto.randomUUID());

    return NextResponse.json(apiSuccess({ team }), { status: 201 });
  } catch (error) {
    return organizationRouteFailure(error);
  }
}
