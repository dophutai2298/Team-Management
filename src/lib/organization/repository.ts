import "server-only";

import type { CurrentActor } from "@/lib/auth/session";
import { getInsForgeAdminClient } from "@/lib/insforge/admin";

import {
  resolveOrganizationScope,
  selectOrganizationEmployeeIds,
  type OrganizationEmployee,
  type OrganizationTeam,
  type OrganizationView,
} from "./organization";
import type { ManagedTeam, TeamManagementInput } from "./team-management";

type EmployeeRow = {
  id: string;
  email: string;
  full_name: string;
  employee_code: string | null;
  avatar_url: string | null;
  primary_role_id: string | null;
  reports_to_employee_id: string | null;
  position_title: string | null;
  level_name: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  code: string;
  parent_team_id: string | null;
  description: string | null;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
  updated_at?: string;
  created_at?: string;
};

type MembershipRow = {
  employee_id: string;
  team_id: string;
  is_primary: boolean;
};

type RoleRow = {
  id: string;
  name: string;
};

type ManagedTeamRpcRow = {
  id: string;
  name: string;
  code: string;
  parentTeamId: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
};

function toManagedTeam(row: TeamRow): ManagedTeam {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    parentTeamId: row.parent_team_id,
    description: row.description,
    metadata: row.metadata ?? {},
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at ?? "",
    createdAt: row.created_at ?? "",
  };
}

function toManagedTeamFromRpc(row: ManagedTeamRpcRow): ManagedTeam {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    parentTeamId: row.parentTeamId,
    description: row.description,
    metadata: row.metadata,
    isActive: row.isActive,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

type EmployeeMembershipIndex = {
  primaryTeamId: string | null;
  teamIds: string[];
};

function addParentTeams(teamIds: Set<string>, teamsById: Map<string, TeamRow>) {
  for (const teamId of [...teamIds]) {
    let current = teamsById.get(teamId);
    const visited = new Set<string>();

    while (current?.parent_team_id && !visited.has(current.parent_team_id)) {
      visited.add(current.parent_team_id);
      teamIds.add(current.parent_team_id);
      current = teamsById.get(current.parent_team_id);
    }
  }
}

function buildMembershipIndex(memberships: MembershipRow[]): Map<string, EmployeeMembershipIndex> {
  const index = new Map<string, EmployeeMembershipIndex>();

  for (const membership of memberships) {
    const existing = index.get(membership.employee_id) ?? { primaryTeamId: null, teamIds: [] };
    existing.teamIds.push(membership.team_id);

    if (membership.is_primary) {
      existing.primaryTeamId = membership.team_id;
    }

    index.set(membership.employee_id, existing);
  }

  return index;
}

export async function getOrganizationView(actor: CurrentActor): Promise<OrganizationView | null> {
  const scope = resolveOrganizationScope(actor);

  if (!scope) {
    return null;
  }

  const client = getInsForgeAdminClient();
  const [employeesResult, teamsResult, membershipsResult, rolesResult] = await Promise.all([
    client.database
      .from("employees")
      .select(
        "id, email, full_name, employee_code, avatar_url, primary_role_id, reports_to_employee_id, position_title, level_name",
      )
      .eq("account_status", "active")
      .order("full_name")
      .limit(1000),
    client.database
      .from("teams")
      .select("id, name, code, parent_team_id, description")
      .eq("is_active", true)
      .order("name")
      .limit(500),
    client.database
      .from("team_memberships")
      .select("employee_id, team_id, is_primary")
      .eq("is_active", true)
      .limit(3000),
    client.database.from("roles").select("id, name").eq("is_active", true).limit(300),
  ]);

  if (employeesResult.error) throw employeesResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (rolesResult.error) throw rolesResult.error;

  const employees = (employeesResult.data ?? []) as EmployeeRow[];
  const teams = (teamsResult.data ?? []) as TeamRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const roles = (rolesResult.data ?? []) as RoleRow[];
  const membershipsByEmployee = buildMembershipIndex(memberships);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.full_name]));
  const readableEmployeeIds = selectOrganizationEmployeeIds(
    actor,
    scope.kind,
    employees.map((employee) => ({
      id: employee.id,
      teamIds: membershipsByEmployee.get(employee.id)?.teamIds ?? [],
    })),
  );
  const visibleRows = employees.filter((employee) => readableEmployeeIds.has(employee.id));
  const visibleEmployeeIdSet = new Set(visibleRows.map((employee) => employee.id));
  const directReportsCounts = new Map<string, number>();

  for (const employee of visibleRows) {
    if (employee.reports_to_employee_id && visibleEmployeeIdSet.has(employee.reports_to_employee_id)) {
      directReportsCounts.set(
        employee.reports_to_employee_id,
        (directReportsCounts.get(employee.reports_to_employee_id) ?? 0) + 1,
      );
    }
  }

  const visibleTeamIds = new Set<string>();
  const organizationEmployees: OrganizationEmployee[] = visibleRows.map((employee) => {
    const membership = membershipsByEmployee.get(employee.id) ?? { primaryTeamId: null, teamIds: [] };
    const primaryTeamName = membership.primaryTeamId ? teamNames.get(membership.primaryTeamId) ?? null : null;

    for (const teamId of membership.teamIds) {
      visibleTeamIds.add(teamId);
    }

    return {
      id: employee.id,
      fullName: employee.full_name,
      email: employee.email,
      employeeCode: employee.employee_code,
      avatarUrl: employee.avatar_url,
      roleName: employee.primary_role_id ? roleNames.get(employee.primary_role_id) ?? null : null,
      managerEmployeeId:
        employee.reports_to_employee_id && visibleEmployeeIdSet.has(employee.reports_to_employee_id)
          ? employee.reports_to_employee_id
          : null,
      managerName:
        employee.reports_to_employee_id && visibleEmployeeIdSet.has(employee.reports_to_employee_id)
          ? employeeNames.get(employee.reports_to_employee_id) ?? null
          : null,
      positionTitle: employee.position_title,
      levelName: employee.level_name,
      primaryTeamId: membership.primaryTeamId,
      primaryTeamName,
      teamIds: membership.teamIds,
      teamNames: membership.teamIds.map((teamId) => teamNames.get(teamId)).filter((name): name is string => Boolean(name)),
      directReportsCount: directReportsCounts.get(employee.id) ?? 0,
    };
  });

  addParentTeams(visibleTeamIds, teamsById);

  const memberCounts = new Map<string, number>();
  for (const employee of organizationEmployees) {
    for (const teamId of employee.teamIds) {
      memberCounts.set(teamId, (memberCounts.get(teamId) ?? 0) + 1);
    }
  }

  const organizationTeams: OrganizationTeam[] = teams
    .filter((team) => visibleTeamIds.has(team.id))
    .map((team) => ({
      id: team.id,
      name: team.name,
      code: team.code,
      parentTeamId: team.parent_team_id,
      description: team.description,
      memberCount: memberCounts.get(team.id) ?? 0,
    }));

  return {
    scope,
    teams: organizationTeams,
    employees: organizationEmployees,
  };
}

export async function listManagedTeams(): Promise<ManagedTeam[]> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("teams")
    .select("id, name, code, parent_team_id, description, metadata, is_active, updated_at, created_at")
    .order("name")
    .limit(500);

  if (error) throw error;

  return ((data ?? []) as TeamRow[]).map(toManagedTeam);
}

export async function createManagedTeam(
  actorAuthUserId: string,
  input: TeamManagementInput,
  requestId: string,
): Promise<ManagedTeam> {
  const { data, error } = await getInsForgeAdminClient().database.rpc("admin_upsert_team", {
    p_actor_auth_user_id: actorAuthUserId,
    p_team_id: null,
    p_name: input.name,
    p_code: input.code,
    p_parent_team_id: input.parentTeamId,
    p_description: input.description,
    p_metadata: input.metadata,
    p_is_active: input.isActive,
    p_request_id: requestId,
  });

  if (error || !data) {
    throw error ?? new Error("Could not create team.");
  }

  return toManagedTeamFromRpc(data as ManagedTeamRpcRow);
}

export async function updateManagedTeam(
  actorAuthUserId: string,
  teamId: string,
  input: TeamManagementInput,
  requestId: string,
): Promise<ManagedTeam | null> {
  const { data, error } = await getInsForgeAdminClient().database.rpc("admin_upsert_team", {
    p_actor_auth_user_id: actorAuthUserId,
    p_team_id: teamId,
    p_name: input.name,
    p_code: input.code,
    p_parent_team_id: input.parentTeamId,
    p_description: input.description,
    p_metadata: input.metadata,
    p_is_active: input.isActive,
    p_request_id: requestId,
  });

  if (error) {
    const databaseCode = "code" in error && typeof error.code === "string" ? error.code : null;

    if (databaseCode === "P0002") {
      return null;
    }

    throw error;
  }

  return data ? toManagedTeamFromRpc(data as ManagedTeamRpcRow) : null;
}
