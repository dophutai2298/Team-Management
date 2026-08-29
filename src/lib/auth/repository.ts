import "server-only";

import { getInsForgeAdminClient } from "@/lib/insforge/admin";
import { createPermissionKey, type Permission, type PermissionKey } from "@/lib/authorization/catalog";

import type { AccountStatus, RegistrationClaim } from "./access";

export type EmployeeAccount = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  employeeCodeClaim: string;
  employeeCode: string | null;
  accountStatus: AccountStatus;
  locale: "vi" | "en";
  primaryRoleId: string | null;
  role: EmployeeRole | null;
  permissions: PermissionKey[];
  memberships: EmployeeMembership[];
  reportsToEmployeeId: string | null;
  descendantEmployeeIds: string[];
};

export type EmployeeRole = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
};

export type EmployeeMembership = {
  teamId: string;
  isPrimary: boolean;
};

type EmployeeRow = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  employee_code_claim: string;
  employee_code: string | null;
  account_status: AccountStatus;
  locale: "vi" | "en";
  primary_role_id: string | null;
  reports_to_employee_id: string | null;
};

type RoleRow = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
};

type RolePermissionRow = {
  permission_id: string;
};

type PermissionRow = {
  resource: Permission["resource"];
  action: Permission["action"];
  scope: Permission["scope"];
};

type MembershipRow = {
  team_id: string;
  is_primary: boolean;
};

type DescendantRow = {
  employee_id: string;
};

type RegistrationClaimRow = {
  email: string;
  full_name: string;
  employee_code_claim: string;
};

function toEmployeeAccount(row: EmployeeRow): EmployeeAccount {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    fullName: row.full_name,
    employeeCodeClaim: row.employee_code_claim,
    employeeCode: row.employee_code,
    accountStatus: row.account_status,
    locale: row.locale,
    primaryRoleId: row.primary_role_id,
    role: null,
    permissions: [],
    memberships: [],
    reportsToEmployeeId: row.reports_to_employee_id,
    descendantEmployeeIds: [],
  };
}

export async function isAllowedEmailDomain(domain: string): Promise<boolean> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("allowed_email_domains")
    .select("id")
    .eq("domain", domain)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

export async function createRegistrationClaim(registration: RegistrationClaim): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.from("registration_claims").upsert(
    [
      {
        email: registration.email,
        full_name: registration.fullName,
        employee_code_claim: registration.employeeCodeClaim,
      },
    ],
    { onConflict: "email" },
  );

  if (error) {
    throw error;
  }
}

export async function getRegistrationClaim(email: string): Promise<RegistrationClaimRow | null> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("registration_claims")
    .select("email, full_name, employee_code_claim")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RegistrationClaimRow | null;
}

export async function createPendingEmployee(
  authUserId: string,
  claim: RegistrationClaimRow,
): Promise<EmployeeAccount> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("employees")
    .upsert(
      [
        {
          auth_user_id: authUserId,
          email: claim.email,
          full_name: claim.full_name,
          employee_code_claim: claim.employee_code_claim,
          account_status: "pending_approval",
        },
      ],
      { onConflict: "auth_user_id" },
    )
    .select(
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale, primary_role_id, reports_to_employee_id",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not create the pending employee account.");
  }

  return toEmployeeAccount(data as EmployeeRow);
}

export async function deleteRegistrationClaim(email: string): Promise<void> {
  const { error } = await getInsForgeAdminClient().database
    .from("registration_claims")
    .delete()
    .eq("email", email);

  if (error) {
    throw error;
  }
}

export async function getEmployeeAccount(authUserId: string): Promise<EmployeeAccount | null> {
  const client = getInsForgeAdminClient();
  const { data, error } = await client.database
    .from("employees")
    .select(
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale, primary_role_id, reports_to_employee_id",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const employee = toEmployeeAccount(data as EmployeeRow);
  const [roleResult, rolePermissionsResult, membershipsResult, descendantsResult] = await Promise.all([
    employee.primaryRoleId
      ? client.database
          .from("roles")
          .select("id, slug, name, is_active")
          .eq("id", employee.primaryRoleId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    employee.primaryRoleId
      ? client.database
          .from("role_permissions")
          .select("permission_id")
          .eq("role_id", employee.primaryRoleId)
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    client.database
      .from("team_memberships")
      .select("team_id, is_primary")
      .eq("employee_id", employee.id)
      .eq("is_active", true)
      .limit(100),
    client.database.rpc("get_employee_descendant_ids", { p_employee_id: employee.id }),
  ]);

  if (roleResult.error) throw roleResult.error;
  if (rolePermissionsResult.error) throw rolePermissionsResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (descendantsResult.error) throw descendantsResult.error;

  const role = roleResult.data as RoleRow | null;
  const permissionIds = role?.is_active
    ? ((rolePermissionsResult.data ?? []) as RolePermissionRow[]).map(({ permission_id }) => permission_id)
    : [];
  const permissionsResult = permissionIds.length
    ? await client.database
        .from("permissions")
        .select("resource, action, scope")
        .in("id", permissionIds)
        .eq("is_active", true)
        .limit(200)
    : { data: [], error: null };

  if (permissionsResult.error) throw permissionsResult.error;

  return {
    ...employee,
    role: role
      ? { id: role.id, slug: role.slug, name: role.name, isActive: role.is_active }
      : null,
    permissions: ((permissionsResult.data ?? []) as PermissionRow[]).map(createPermissionKey),
    memberships: ((membershipsResult.data ?? []) as MembershipRow[]).map((membership) => ({
      teamId: membership.team_id,
      isPrimary: membership.is_primary,
    })),
    descendantEmployeeIds: ((descendantsResult.data ?? []) as DescendantRow[]).map(
      ({ employee_id }) => employee_id,
    ),
  };
}
