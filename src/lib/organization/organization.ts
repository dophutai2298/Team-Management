import type { AuthorizationActor } from "@/lib/authorization/authorization";
import type { PermissionKey } from "@/lib/authorization/catalog";

export type OrganizationScopeKind = "all" | "subtree" | "team" | "self";

export type OrganizationScope = {
  kind: OrganizationScopeKind;
  labelKey:
    | "organization.scopeAll"
    | "organization.scopeSubtree"
    | "organization.scopeTeam"
    | "organization.scopeSelf";
};

export type OrganizationTeam = {
  id: string;
  name: string;
  code: string;
  parentTeamId: string | null;
  description: string | null;
  memberCount: number;
};

export type OrganizationEmployee = {
  id: string;
  fullName: string;
  email: string;
  employeeCode: string | null;
  avatarUrl: string | null;
  roleName: string | null;
  managerEmployeeId: string | null;
  managerName: string | null;
  positionTitle: string | null;
  levelName: string | null;
  primaryTeamId: string | null;
  primaryTeamName: string | null;
  teamIds: string[];
  teamNames: string[];
  directReportsCount: number;
};

export type OrganizationView = {
  scope: OrganizationScope;
  teams: OrganizationTeam[];
  employees: OrganizationEmployee[];
};

const SCOPE_BY_PRIORITY: readonly {
  kind: OrganizationScopeKind;
  labelKey: OrganizationScope["labelKey"];
  permissions: readonly PermissionKey[];
}[] = [
  {
    kind: "all",
    labelKey: "organization.scopeAll",
    permissions: ["employee:read:all", "team:read:all", "dashboard:read:all"],
  },
  {
    kind: "subtree",
    labelKey: "organization.scopeSubtree",
    permissions: ["employee:read:subtree", "team:read:subtree", "dashboard:read:subtree"],
  },
  {
    kind: "team",
    labelKey: "organization.scopeTeam",
    permissions: ["employee:read:team", "team:read:team"],
  },
  {
    kind: "self",
    labelKey: "organization.scopeSelf",
    permissions: ["employee:read:self", "dashboard:read:self"],
  },
];

export function resolveOrganizationScope(actor: AuthorizationActor | null): OrganizationScope | null {
  if (!actor?.employeeId || actor.accountStatus !== "active") {
    return null;
  }

  const permissions = new Set(actor.permissions);
  const scope = SCOPE_BY_PRIORITY.find(({ permissions: requiredPermissions }) =>
    requiredPermissions.some((permission) => permissions.has(permission)),
  );

  return scope ? { kind: scope.kind, labelKey: scope.labelKey } : null;
}

export function selectOrganizationEmployeeIds(
  actor: AuthorizationActor,
  scope: OrganizationScopeKind,
  employees: readonly { id: string; teamIds: readonly string[] }[],
): Set<string> {
  if (scope === "all") {
    return new Set(employees.map((employee) => employee.id));
  }

  if (scope === "subtree") {
    return new Set([actor.employeeId, ...actor.descendantEmployeeIds].filter((id): id is string => Boolean(id)));
  }

  if (scope === "team") {
    const actorTeamIds = new Set(actor.memberships.map((membership) => membership.teamId));

    return new Set(
      employees
        .filter((employee) => employee.teamIds.some((teamId) => actorTeamIds.has(teamId)))
        .map((employee) => employee.id),
    );
  }

  return new Set(actor.employeeId ? [actor.employeeId] : []);
}
