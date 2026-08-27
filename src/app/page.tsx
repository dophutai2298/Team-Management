import { redirect } from "next/navigation";

import { getAccountDestination } from "@/lib/auth/access";
import { getCurrentActor } from "@/lib/auth/session";

export default async function HomePage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  redirect(getAccountDestination(actor.access));
}
