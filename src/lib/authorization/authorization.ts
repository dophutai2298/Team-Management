import type { AccountStatus } from "@/lib/auth/access";

import {
  createPermissionKey,
  type PermissionAction,
  type PermissionKey,
  type PermissionResource,
  type PermissionScope,
} from "./catalog";

export type ActorMembership = {
  teamId: string;
  isPrimary: boolean;
};

export type AuthorizationActor = {
  accountStatus: AccountStatus | null;
  employeeId: string | null;
  permissions: readonly PermissionKey[];
  memberships: readonly ActorMembership[];
  descendantEmployeeIds: readonly string[];
};

export type AuthorizationTarget = {
  employeeId?: string;
  teamIds?: readonly string[];
};

export class AuthorizationError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    readonly status: 401 | 403,
  ) {
    super(code === "UNAUTHENTICATED" ? "Sign in to continue." : "You do not have permission to perform this action.");
    this.name = "AuthorizationError";
  }
}

function hasPermission(
  actor: AuthorizationActor,
  resource: PermissionResource,
  action: PermissionAction,
  scope: PermissionScope,
): boolean {
  return actor.permissions.includes(createPermissionKey({ resource, action, scope }));
}

export function isAuthorized(
  actor: AuthorizationActor | null,
  action: PermissionAction,
  resource: PermissionResource,
  target: AuthorizationTarget = {},
): boolean {
  if (!actor?.employeeId || actor.accountStatus !== "active") {
    return false;
  }

  if (hasPermission(actor, resource, action, "all")) {
    return true;
  }

  if (target.employeeId === actor.employeeId && hasPermission(actor, resource, action, "self")) {
    return true;
  }

  if (
    target.employeeId &&
    actor.descendantEmployeeIds.includes(target.employeeId) &&
    hasPermission(actor, resource, action, "subtree")
  ) {
    return true;
  }

  if (target.teamIds?.length && hasPermission(actor, resource, action, "team")) {
    const actorTeamIds = new Set(actor.memberships.map(({ teamId }) => teamId));
    return target.teamIds.some((teamId) => actorTeamIds.has(teamId));
  }

  return false;
}

export function authorize(
  actor: AuthorizationActor | null,
  action: PermissionAction,
  resource: PermissionResource,
  target: AuthorizationTarget = {},
): asserts actor is AuthorizationActor {
  if (!actor) {
    throw new AuthorizationError("UNAUTHENTICATED", 401);
  }

  if (!isAuthorized(actor, action, resource, target)) {
    throw new AuthorizationError("FORBIDDEN", 403);
  }
}
