import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getAccountDestination } from "@/lib/auth/access";
import { getCurrentActor } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login?returnTo=/dashboard");
  }

  if (!actor.access.canAccessWorkspace) {
    redirect(getAccountDestination(actor.access));
  }

  return <AppShell canAccessAdmin={actor.employee?.isAdmin === true}>{children}</AppShell>;
}
