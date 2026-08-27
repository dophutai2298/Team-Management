import { redirect } from "next/navigation";

import { AccessStatus } from "@/components/auth-shell";
import { getCurrentActor } from "@/lib/auth/session";

export default async function PendingPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  if (actor.access.canAccessWorkspace) {
    redirect("/dashboard");
  }

  if (actor.access.kind !== "pending_approval") {
    redirect("/account-status");
  }

  return <AccessStatus kind="pending" />;
}
