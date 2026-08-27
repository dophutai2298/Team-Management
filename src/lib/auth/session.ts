import "server-only";

import { createInsForgeServerClient } from "@/lib/insforge/server";

import { getAuthenticatedAccountAccess, type AccountAccess } from "./access";
import { getEmployeeAccount, type EmployeeAccount } from "./repository";

export type CurrentActor = {
  authUserId: string;
  email: string;
  employee: EmployeeAccount | null;
  access: AccountAccess;
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
  };
}
