import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminApprovalWorkspace } from "@/components/admin-approval-workspace";
import { isAdminActor } from "@/lib/admin/access";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account approvals",
};

export default async function AdminApprovalPage() {
  const actor = await getCurrentActor();

  if (!isAdminActor(actor)) {
    redirect("/dashboard");
  }

  return <AdminApprovalWorkspace />;
}
