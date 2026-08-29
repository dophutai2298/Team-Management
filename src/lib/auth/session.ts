import "server-only";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { AuthorizationActor } from "@/lib/authorization/authorization";

import { getAuthenticatedAccountAccess, type AccountAccess } from "./access";
import { getEmployeeAccount, type EmployeeAccount } from "./repository";

export type CurrentActor = AuthorizationActor & {
  authUserId: string;
  email: string;
  employee: EmployeeAccount | null;
  access: AccountAccess;
  role: EmployeeAccount["role"];
  managerEmployeeId: string | null;
};

export async function getCurrentActor(): Promise<CurrentActor | null> {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();

  if (error) {
    throw error;
  }

  if (!data.user?.id || !data.user.email) {
    return null;
  }

  const employee = await getEmployeeAccount(data.user.id);

  return {
    authUserId: data.user.id,
    email: data.user.email.toLowerCase(),
    employee,
    access: getAuthenticatedAccountAccess(employee),
    accountStatus: employee?.accountStatus ?? null,
    employeeId: employee?.id ?? null,
    role: employee?.role ?? null,
    permissions: employee?.permissions ?? [],
    memberships: employee?.memberships ?? [],
    managerEmployeeId: employee?.reportsToEmployeeId ?? null,
    descendantEmployeeIds: employee?.descendantEmployeeIds ?? [],
  };
}
