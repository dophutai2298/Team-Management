import { redirect } from "next/navigation";

import { AccessStatus } from "@/components/auth-shell";
import { getAccountDestination } from "@/lib/auth/access";
import { getCurrentActor } from "@/lib/auth/session";

export default async function PendingPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  const destination = getAccountDestination(actor.access);

  if (destination !== "/pending") {
    redirect(destination);
  }

  return <AccessStatus kind="pending" />;
}
