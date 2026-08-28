import "server-only";

import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";

export class AdminAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Sign in to continue." : "Administrator access is required.");
    this.name = "AdminAccessError";
  }
}

export function isAdminActor(actor: CurrentActor | null): actor is CurrentActor {
  return Boolean(actor?.access.canAccessWorkspace && actor.employee?.isAdmin);
}

export async function requireAdminActor(): Promise<CurrentActor> {
  const actor = await getCurrentActor();

  if (!actor) {
    throw new AdminAccessError(401);
  }

  if (!isAdminActor(actor)) {
    throw new AdminAccessError(403);
  }

  return actor;
}
