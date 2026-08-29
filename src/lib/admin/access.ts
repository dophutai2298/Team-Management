import "server-only";

import { requireAuthorizedActor } from "@/lib/authorization/access";
import { isAuthorized } from "@/lib/authorization/authorization";
import type { CurrentActor } from "@/lib/auth/session";

export function isAdminActor(actor: CurrentActor | null): actor is CurrentActor {
  return isAuthorized(actor, "read", "account");
}

export async function requireAdminActor(): Promise<CurrentActor> {
  return requireAuthorizedActor("read", "account");
}
