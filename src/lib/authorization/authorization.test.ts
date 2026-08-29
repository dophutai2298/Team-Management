import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  authorize,
  isAuthorized,
  type AuthorizationActor,
} from "./authorization";

const parentActor: AuthorizationActor = {
  accountStatus: "active",
  employeeId: "leader",
  permissions: ["employee:update:self", "employee:update:subtree", "employee:read:team"],
  memberships: [{ teamId: "delivery", isPrimary: true }],
  descendantEmployeeIds: ["direct-report", "descendant"],
};

describe("authorization matrix", () => {
  it("allows an employee to act on self", () => {
    expect(isAuthorized(parentActor, "update", "employee", { employeeId: "leader" })).toBe(true);
  });

  it.each([
    ["direct report", "direct-report"],
    ["descendant", "descendant"],
  ])("allows a parent to act on a %s through subtree scope", (_, employeeId) => {
    expect(isAuthorized(parentActor, "update", "employee", { employeeId })).toBe(true);
  });

  it.each([
    ["peer", "peer"],
    ["manager", "manager"],
    ["other subtree", "other-subtree"],
  ])("denies a parent access to a %s", (_, employeeId) => {
    expect(isAuthorized(parentActor, "update", "employee", { employeeId })).toBe(false);
  });

  it("uses active team memberships for team scope", () => {
    expect(isAuthorized(parentActor, "read", "employee", { employeeId: "peer", teamIds: ["delivery"] })).toBe(true);
    expect(isAuthorized(parentActor, "read", "employee", { employeeId: "other", teamIds: ["finance"] })).toBe(false);
  });

  it("allows all scope without consulting a role name", () => {
    const actor: AuthorizationActor = {
      ...parentActor,
      permissions: ["employee:update:all"],
      descendantEmployeeIds: [],
    };

    expect(isAuthorized(actor, "update", "employee", { employeeId: "other-subtree" })).toBe(true);
  });

  it("denies inactive accounts even when their permission list contains a matching capability", () => {
    expect(
      isAuthorized(
        { ...parentActor, accountStatus: "disabled", permissions: ["employee:update:all"] },
        "update",
        "employee",
        { employeeId: "direct-report" },
      ),
    ).toBe(false);
  });

  it("provides a common mutation guard with stable unauthenticated and forbidden errors", () => {
    expect(() => authorize(null, "update", "employee", { employeeId: "direct-report" })).toThrowError(
      new AuthorizationError("UNAUTHENTICATED", 401),
    );
    expect(() => authorize(parentActor, "update", "employee", { employeeId: "peer" })).toThrowError(
      new AuthorizationError("FORBIDDEN", 403),
    );
    expect(authorize(parentActor, "update", "employee", { employeeId: "direct-report" })).toBeUndefined();
  });
});
