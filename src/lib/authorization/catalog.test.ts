import { describe, expect, it } from "vitest";

import {
  MVP_RESOURCES,
  PERMISSION_CATALOG,
  ROLE_TEMPLATE_PERMISSIONS,
  createPermissionKey,
} from "./catalog";

describe("permission catalog", () => {
  it("covers every MVP resource with resource-action-scope permission keys", () => {
    expect(MVP_RESOURCES).toEqual([
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
    ]);

    const catalogKeys = new Set(PERMISSION_CATALOG.map(createPermissionKey));

    expect(catalogKeys.size).toBe(PERMISSION_CATALOG.length);
    for (const resource of MVP_RESOURCES) {
      expect(PERMISSION_CATALOG.some((permission) => permission.resource === resource)).toBe(true);
    }
  });

  it("defines the four seed role templates as catalog-backed permission bundles", () => {
    expect(Object.keys(ROLE_TEMPLATE_PERMISSIONS)).toEqual([
      "system-admin",
      "department-head",
      "team-leader",
      "employee",
    ]);

    const catalogKeys = new Set(PERMISSION_CATALOG.map(createPermissionKey));
    for (const permissions of Object.values(ROLE_TEMPLATE_PERMISSIONS)) {
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((permission) => catalogKeys.has(permission))).toBe(true);
    }
  });

  it("grants the system administrator an all-scoped capability for every catalog action", () => {
    const adminPermissions = new Set(ROLE_TEMPLATE_PERMISSIONS["system-admin"]);

    for (const permission of PERMISSION_CATALOG) {
      if (permission.scope === "all") {
        expect(adminPermissions.has(createPermissionKey(permission))).toBe(true);
      }
    }
  });
});
