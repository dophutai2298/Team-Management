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
  isAdmin: boolean;
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
  is_admin: boolean;
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
    isAdmin: row.is_admin,
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
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale, is_admin",
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
  const { data, error } = await getInsForgeAdminClient().database
    .from("employees")
    .select(
      "id, auth_user_id, email, full_name, employee_code_claim, employee_code, account_status, locale, is_admin",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toEmployeeAccount(data as EmployeeRow) : null;
}
