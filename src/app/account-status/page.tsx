import { redirect } from "next/navigation";

import { AccessStatus } from "@/components/auth-shell";
import { getAccountDestination } from "@/lib/auth/access";
import { getCurrentActor } from "@/lib/auth/session";

export default async function AccountStatusPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  const destination = getAccountDestination(actor.access);

  if (destination !== "/account-status") {
    redirect(destination);
  }

  return <AccessStatus kind="blocked" />;
}
