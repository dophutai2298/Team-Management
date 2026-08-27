import "server-only";

import { getInsForgeAdminClient } from "@/lib/insforge/admin";

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
};

type RegistrationClaimRow = {
  auth_user_id: string;
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

export async function createRegistrationClaim(
  authUserId: string,
  registration: RegistrationClaim,
): Promise<void> {
  const { error } = await getInsForgeAdminClient().database.from("registration_claims").insert([
    {
      auth_user_id: authUserId,
      email: registration.email,
      full_name: registration.fullName,
      employee_code_claim: registration.employeeCodeClaim,
    },
  ]);

  if (error) {
    throw error;
  }
}

export async function getRegistrationClaim(authUserId: string): Promise<RegistrationClaimRow | null> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("registration_claims")
    .select("auth_user_id, email, full_name, employee_code_claim")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RegistrationClaimRow | null;
}

export async function createPendingEmployee(
  claim: RegistrationClaimRow,
): Promise<EmployeeAccount> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("employees")
    .upsert(
      [
        {
          auth_user_id: claim.auth_user_id,
          email: claim.email,
          full_name: claim.full_name,
          employee_code_claim: claim.employee_code_claim,
          account_status: "pending_approval",
        },
      ],
      { onConflict: "auth_user_id" },
    )
    .select(
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not create the pending employee account.");
  }

  return toEmployeeAccount(data as EmployeeRow);
}

export async function deleteRegistrationClaim(authUserId: string): Promise<void> {
  const { error } = await getInsForgeAdminClient().database
    .from("registration_claims")
    .delete()
    .eq("auth_user_id", authUserId);

  if (error) {
    throw error;
  }
}

export async function getEmployeeAccount(authUserId: string): Promise<EmployeeAccount | null> {
  const { data, error } = await getInsForgeAdminClient().database
    .from("employees")
    .select(
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployeeAccount(data as EmployeeRow) : null;
}
