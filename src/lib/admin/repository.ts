import "server-only";

import { getInsForgeAdminClient } from "@/lib/insforge/admin";

import type { ApprovalInput, ApprovalOptions, OrganizationOption, PendingAccount, RejectionInput } from "./approval";

type PendingAccountRow = {
  id: string;
  full_name: string;
  email: string;
  employee_code_claim: string;
  created_at: string;
};

type OrganizationOptionRow = {
  id: string;
  name?: string;
  full_name?: string;
  code?: string;
  employee_code?: string | null;
};

function toOption(row: OrganizationOptionRow): OrganizationOption {
  const name = row.name ?? row.full_name ?? "Unknown";
  const detail = row.code ?? row.employee_code ?? undefined;

  return { id: row.id, name, ...(detail ? { detail } : {}) };
}

export async function listPendingAccounts(): Promise<PendingAccount[]> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("employees")
    .select("id, full_name, email, employee_code_claim, created_at")
    .eq("account_status", "pending_approval")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as PendingAccountRow[]).map((account) => ({
    id: account.id,
    fullName: account.full_name,
    email: account.email,
    employeeCodeClaim: account.employee_code_claim,
    requestedAt: account.created_at,
  }));
}

export async function getApprovalOptions(): Promise<ApprovalOptions> {
  const client = getInsForgeAdminClient();
  const [teams, roles, managers] = await Promise.all([
    client.database.from("teams").select("id, name, code").eq("is_active", true).order("name").limit(100),
    client.database.from("roles").select("id, name").eq("is_active", true).order("name").limit(100),
    client.database
      .from("employees")
      .select("id, full_name, employee_code")
      .eq("account_status", "active")
      .order("full_name")
      .limit(100),
  ]);

  if (teams.error) throw teams.error;
  if (roles.error) throw roles.error;
  if (managers.error) throw managers.error;

  return {
    teams: ((teams.data ?? []) as OrganizationOptionRow[]).map(toOption),
    roles: ((roles.data ?? []) as OrganizationOptionRow[]).map(toOption),
    managers: ((managers.data ?? []) as OrganizationOptionRow[]).map(toOption),
  };
}

export async function approvePendingAccount(
  actorAuthUserId: string,
  employeeId: string,
  input: ApprovalInput,
  requestId: string,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.rpc("approve_pending_employee", {
    p_actor_auth_user_id: actorAuthUserId,
    p_employee_id: employeeId,
    p_employee_code: input.employeeCode,
    p_team_id: input.teamId,
    p_manager_employee_id: input.managerEmployeeId,
    p_role_id: input.roleId,
    p_position_title: input.positionTitle,
    p_level_name: input.levelName,
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }
}

export async function rejectPendingAccount(
  actorAuthUserId: string,
  employeeId: string,
  input: RejectionInput,
  requestId: string,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.rpc("reject_pending_employee", {
    p_actor_auth_user_id: actorAuthUserId,
    p_employee_id: employeeId,
    p_reason: input.reason,
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }
}
