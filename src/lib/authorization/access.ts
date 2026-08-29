import "server-only";

import { getCurrentActor, type CurrentActor } from "@/lib/auth/session";

import { authorize, type AuthorizationTarget } from "./authorization";
import type { PermissionAction, PermissionResource } from "./catalog";

export async function requireAuthorizedActor(
  action: PermissionAction,
  resource: PermissionResource,
  target: AuthorizationTarget = {},
): Promise<CurrentActor> {
  const actor = await getCurrentActor();

  authorize(actor, action, resource, target);

  return actor;
}
