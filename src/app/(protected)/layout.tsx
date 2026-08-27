import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentActor } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login?returnTo=/dashboard");
  }

  if (!actor.access.canAccessWorkspace) {
    redirect(actor.access.kind === "pending_approval" ? "/pending" : "/account-status");
  }

  return <AppShell>{children}</AppShell>;
}
