import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmployeeManagementWorkspace } from "@/components/employee-management-workspace";
import { isAdminActor } from "@/lib/admin/access";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Employees",
};

export default async function EmployeesPage() {
  const actor = await getCurrentActor();

  if (!isAdminActor(actor)) {
    redirect("/dashboard");
  }

  return <EmployeeManagementWorkspace />;
}
