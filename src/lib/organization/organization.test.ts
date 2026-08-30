import { describe, expect, it } from "vitest";

import type { AuthorizationActor } from "@/lib/authorization/authorization";

import { resolveOrganizationScope, selectOrganizationEmployeeIds } from "./organization";

const actor: AuthorizationActor = {
  accountStatus: "active",
  employeeId: "leader",
  permissions: [],
  memberships: [{ teamId: "platform", isPrimary: true }],
  descendantEmployeeIds: ["report"],
};

const employees = [
  { id: "leader", teamIds: ["platform"] },
  { id: "report", teamIds: ["platform"] },
  { id: "peer", teamIds: ["platform"] },
  { id: "other", teamIds: ["finance"] },
] as const;

describe("organization scope", () => {
  it("selects the broadest available read scope", () => {
    expect(resolveOrganizationScope({ ...actor, permissions: ["team:read:team", "employee:read:subtree"] })).toEqual({
      kind: "subtree",
      labelKey: "organization.scopeSubtree",
    });
    expect(resolveOrganizationScope({ ...actor, permissions: ["team:read:all"] })).toEqual({
      kind: "all",
      labelKey: "organization.scopeAll",
    });
  });

  it("denies inactive or permissionless actors", () => {
    expect(resolveOrganizationScope({ ...actor, accountStatus: "disabled", permissions: ["team:read:all"] })).toBeNull();
    expect(resolveOrganizationScope(actor)).toBeNull();
  });

  it("keeps team scope distinct from reportsTo subtree scope", () => {
    expect([...selectOrganizationEmployeeIds(actor, "team", employees)].sort()).toEqual([
      "leader",
      "peer",
      "report",
    ]);
    expect([...selectOrganizationEmployeeIds(actor, "subtree", employees)].sort()).toEqual(["leader", "report"]);
  });
});
