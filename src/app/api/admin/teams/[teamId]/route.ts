import { NextResponse, type NextRequest } from "next/server";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { requireAuthorizedActor } from "@/lib/authorization/access";
import { organizationRouteFailure } from "@/lib/organization/http";
import { updateManagedTeam } from "@/lib/organization/repository";
import {
  validateTeamId,
  validateTeamManagementInput,
  type ManagedTeam,
} from "@/lib/organization/team-management";

type RouteContext = { params: Promise<{ teamId: string }> };

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<{ team: ManagedTeam }>>> {
  const { teamId } = await context.params;
  const teamValidation = validateTeamId(teamId);
  const inputValidation = validateTeamManagementInput(await readJsonBody(request));

  if (!teamValidation.ok) {
    return NextResponse.json(apiFailure(teamValidation.code, "Invalid team identifier."), { status: 400 });
  }

  if (!inputValidation.ok) {
    return NextResponse.json(apiFailure(inputValidation.code, "Invalid team input."), { status: 400 });
  }

  try {
    const actor = await requireAuthorizedActor("update", "team", { teamIds: [teamValidation.value] });
    const team = await updateManagedTeam(
      actor.authUserId,
      teamValidation.value,
      inputValidation.value,
      crypto.randomUUID(),
    );

    if (!team) {
      return NextResponse.json(apiFailure("TEAM_NOT_FOUND", "Team not found."), { status: 404 });
    }

    return NextResponse.json(apiSuccess({ team }));
  } catch (error) {
    return organizationRouteFailure(error);
  }
}
