import "server-only";

import { getInsForgeAdminClient } from "@/lib/insforge/admin";

import type {
  AdminEmployeeInput,
  EmployeeManagementOptions,
  EmployeeProfile,
  EmployeeProfileInput,
  EmployeeSummary,
} from "./profile";

type EmployeeRow = {
  id: string;
  email: string;
  full_name: string;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  hometown: string | null;
  avatar_url: string | null;
  timezone: string | null;
  locale: "vi" | "en";
  employee_code: string | null;
  account_status: EmployeeSummary["accountStatus"];
  primary_role_id: string | null;
  reports_to_employee_id: string | null;
  position_title: string | null;
  level_name: string | null;
  updated_at: string;
  created_at: string;
};

type RoleRow = {
  id: string;
  name: string;
};

type TeamRow = {
  id: string;
  name: string;
  code?: string;
};

type MembershipRow = {
  employee_id: string;
  team_id: string;
};

type ManagerRow = {
  id: string;
  full_name: string;
  employee_code: string | null;
};

type OptionRow = {
  id: string;
  name?: string;
  code?: string;
  full_name?: string;
  employee_code?: string | null;
};

function toOption(row: OptionRow): EmployeeManagementOptions["teams"][number] {
  const name = row.name ?? row.full_name ?? "Unknown";
  const detail = row.code ?? row.employee_code ?? undefined;

  return { id: row.id, name, ...(detail ? { detail } : {}) };
}

function toEmployeeProfile(row: EmployeeRow, lookups: EmployeeLookups): EmployeeProfile {
  const teamId = lookups.employeePrimaryTeamIds.get(row.id) ?? null;
  const roleName = row.primary_role_id ? lookups.roleNames.get(row.primary_role_id) ?? null : null;
  const teamName = teamId ? lookups.teamNames.get(teamId) ?? null : null;
  const managerName = row.reports_to_employee_id
    ? lookups.managerNames.get(row.reports_to_employee_id) ?? null
    : null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    birthday: row.birthday,
    phone: row.phone,
    address: row.address,
    hometown: row.hometown,
    avatarUrl: row.avatar_url,
    timezone: row.timezone ?? "Asia/Saigon",
    locale: row.locale,
    employeeCode: row.employee_code,
    roleName,
    teamName,
    managerName,
    positionTitle: row.position_title,
    levelName: row.level_name,
    accountStatus: row.account_status,
  };
}

type EmployeeLookups = {
  roleNames: Map<string, string>;
  teamNames: Map<string, string>;
  managerNames: Map<string, string>;
  employeePrimaryTeamIds: Map<string, string>;
};

async function getEmployeeLookups(): Promise<EmployeeLookups> {
  const client = getInsForgeAdminClient();
  const [roles, teams, managers, memberships] = await Promise.all([
    client.database.from("roles").select("id, name").limit(200),
    client.database.from("teams").select("id, name, code").limit(300),
    client.database.from("employees").select("id, full_name, employee_code").eq("account_status", "active").limit(500),
    client.database
      .from("team_memberships")
      .select("employee_id, team_id")
      .eq("is_primary", true)
      .eq("is_active", true)
      .limit(1000),
  ]);

  if (roles.error) throw roles.error;
  if (teams.error) throw teams.error;
  if (managers.error) throw managers.error;
  if (memberships.error) throw memberships.error;

  return {
    roleNames: new Map(((roles.data ?? []) as RoleRow[]).map((role) => [role.id, role.name])),
    teamNames: new Map(((teams.data ?? []) as TeamRow[]).map((team) => [team.id, team.name])),
    managerNames: new Map(((managers.data ?? []) as ManagerRow[]).map((manager) => [manager.id, manager.full_name])),
    employeePrimaryTeamIds: new Map(
      ((memberships.data ?? []) as MembershipRow[]).map((membership) => [membership.employee_id, membership.team_id]),
    ),
  };
}

export async function getOwnEmployeeProfile(employeeId: string): Promise<EmployeeProfile | null> {
  const client = getInsForgeAdminClient();
  const { data, error } = await client.database
    .from("employees")
    .select(
      "id, email, full_name, birthday, phone, address, hometown, avatar_url, timezone, locale, employee_code, account_status, primary_role_id, reports_to_employee_id, position_title, level_name, updated_at, created_at",
    )
    .eq("id", employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toEmployeeProfile(data as EmployeeRow, await getEmployeeLookups());
}

export async function updateOwnEmployeeProfile(
  actorAuthUserId: string,
  input: EmployeeProfileInput,
  requestId: string,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.rpc("update_employee_profile_self", {
    p_auth_user_id: actorAuthUserId,
    p_full_name: input.fullName,
    p_birthday: input.birthday,
    p_phone: input.phone,
    p_address: input.address,
    p_hometown: input.hometown,
    p_avatar_url: input.avatarUrl,
    p_avatar_key: null,
    p_timezone: input.timezone,
    p_locale: input.locale,
    p_request_id: requestId,
  });

  if (error) throw error;
}

export async function listManagedEmployees(): Promise<EmployeeSummary[]> {
  const client = getInsForgeAdminClient();
  const { data, error } = await client.database
    .from("employees")
    .select(
      "id, email, full_name, birthday, phone, address, hometown, avatar_url, timezone, locale, employee_code, account_status, primary_role_id, reports_to_employee_id, position_title, level_name, updated_at, created_at",
    )
    .neq("account_status", "pending_approval")
    .order("full_name")
    .limit(500);

  if (error) throw error;

  const lookups = await getEmployeeLookups();

  return ((data ?? []) as EmployeeRow[]).map((row) => {
    const profile = toEmployeeProfile(row, lookups);

    return {
      ...profile,
      roleId: row.primary_role_id,
      teamId: lookups.employeePrimaryTeamIds.get(row.id) ?? null,
      managerEmployeeId: row.reports_to_employee_id,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  });
}

export async function getEmployeeManagementOptions(): Promise<EmployeeManagementOptions> {
  const client = getInsForgeAdminClient();
  const [teams, roles, managers] = await Promise.all([
    client.database.from("teams").select("id, name, code").eq("is_active", true).order("name").limit(300),
    client.database.from("roles").select("id, name").eq("is_active", true).order("name").limit(200),
    client.database
      .from("employees")
      .select("id, full_name, employee_code")
      .eq("account_status", "active")
      .order("full_name")
      .limit(500),
  ]);

  if (teams.error) throw teams.error;
  if (roles.error) throw roles.error;
  if (managers.error) throw managers.error;

  return {
    teams: ((teams.data ?? []) as OptionRow[]).map(toOption),
    roles: ((roles.data ?? []) as OptionRow[]).map(toOption),
    managers: ((managers.data ?? []) as OptionRow[]).map(toOption),
  };
}

export async function updateManagedEmployee(
  actorAuthUserId: string,
  employeeId: string,
  input: AdminEmployeeInput,
  requestId: string,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.rpc("admin_update_employee", {
    p_actor_auth_user_id: actorAuthUserId,
    p_employee_id: employeeId,
    p_employee_code: input.employeeCode,
    p_team_id: input.teamId,
    p_manager_employee_id: input.managerEmployeeId,
    p_role_id: input.roleId,
    p_position_title: input.positionTitle,
    p_level_name: input.levelName,
    p_account_status: input.accountStatus,
    p_request_id: requestId,
  });

  if (error) throw error;
}
