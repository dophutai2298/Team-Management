export const MVP_RESOURCES = [
  "account",
  "employee",
  "team",
  "role",
  "permission",
  "task",
  "calendar",
  "notification",
  "todo",
  "pomodoro",
  "music",
  "audit",
  "dashboard",
] as const;

export const PERMISSION_SCOPES = ["self", "team", "subtree", "all"] as const;

export const PERMISSION_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "disable",
  "activate",
  "assign",
  "comment",
  "attach",
  "manage_members",
] as const;

export type PermissionResource = (typeof MVP_RESOURCES)[number];
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type Permission = {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
};

export type PermissionKey = `${PermissionResource}:${PermissionAction}:${PermissionScope}`;
export type RoleTemplateSlug = "system-admin" | "department-head" | "team-leader" | "employee";

type ResourceDefinition = {
  resource: PermissionResource;
  actions: readonly PermissionAction[];
  scopes: readonly PermissionScope[];
};

const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
  { resource: "account", actions: ["read", "approve", "reject", "disable", "activate"], scopes: ["all"] },
  { resource: "employee", actions: ["read", "create", "update", "disable", "activate"], scopes: ["self", "team", "subtree", "all"] },
  { resource: "team", actions: ["read", "create", "update", "delete", "manage_members"], scopes: ["team", "subtree", "all"] },
  { resource: "role", actions: ["read", "create", "update", "delete", "assign"], scopes: ["all"] },
  { resource: "permission", actions: ["read", "assign"], scopes: ["all"] },
  { resource: "task", actions: ["read", "create", "update", "delete", "assign", "comment", "attach"], scopes: ["self", "team", "subtree", "all"] },
  { resource: "calendar", actions: ["read", "create", "update", "delete"], scopes: ["self", "team", "subtree", "all"] },
  { resource: "notification", actions: ["read", "update"], scopes: ["self", "all"] },
  { resource: "todo", actions: ["read", "create", "update", "delete"], scopes: ["self", "all"] },
  { resource: "pomodoro", actions: ["read", "create", "update", "delete"], scopes: ["self", "all"] },
  { resource: "music", actions: ["read", "create", "update", "delete"], scopes: ["all"] },
  { resource: "audit", actions: ["read"], scopes: ["all"] },
  { resource: "dashboard", actions: ["read"], scopes: ["self", "subtree", "all"] },
] as const;

export const PERMISSION_CATALOG: readonly Permission[] = RESOURCE_DEFINITIONS.flatMap(
  ({ resource, actions, scopes }) =>
    actions.flatMap((action) => scopes.map((scope) => ({ resource, action, scope }))),
);

export function createPermissionKey(permission: Permission): PermissionKey {
  return `${permission.resource}:${permission.action}:${permission.scope}`;
}

function selectPermissionKeys(predicate: (permission: Permission) => boolean): PermissionKey[] {
  return PERMISSION_CATALOG.filter(predicate).map(createPermissionKey);
}

const employeePermissions = selectPermissionKeys(({ resource, action, scope }) => {
  if (resource === "employee") return scope === "self" && (action === "read" || action === "update");
  if (resource === "team") return scope === "team" && action === "read";
  if (resource === "task") return scope === "self" && action !== "assign";
  if (resource === "calendar") return scope === "self" || (scope === "team" && action === "read");
  if (resource === "notification" || resource === "todo" || resource === "pomodoro") return scope === "self";
  if (resource === "music") return scope === "all" && action === "read";
  return resource === "dashboard" && scope === "self" && action === "read";
});

const parentPermissions = selectPermissionKeys(({ resource, action, scope }) => {
  if (resource === "employee") {
    return (scope === "subtree" && (action === "read" || action === "update")) ||
      (scope === "team" && action === "read");
  }
  if (resource === "team") return (scope === "team" || scope === "subtree") && action === "read";
  if (resource === "role" || resource === "permission") return scope === "all" && action === "read";
  if (resource === "task") return scope === "subtree";
  if (resource === "calendar") return scope === "subtree";
  return resource === "dashboard" && scope === "subtree" && action === "read";
});

const managerTemplatePermissions = [...new Set([...employeePermissions, ...parentPermissions])];

export const ROLE_TEMPLATE_PERMISSIONS: Readonly<Record<RoleTemplateSlug, readonly PermissionKey[]>> = {
  "system-admin": selectPermissionKeys(({ scope }) => scope === "all"),
  "department-head": managerTemplatePermissions,
  "team-leader": managerTemplatePermissions,
  employee: employeePermissions,
};
