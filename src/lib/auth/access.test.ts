import { describe, expect, it } from "vitest";

import {
  getAccountDestination,
  getAccountAccess,
  getAuthenticatedAccountAccess,
  getEmailDomain,
  validateRegistration,
} from "./access";

describe("registration access rules", () => {
  it("normalizes a company email domain", () => {
    expect(getEmailDomain("  Mai.Nguyen@Example.COM ")).toBe("example.com");
  });

  it("accepts a complete registration claim", () => {
    expect(
      validateRegistration({
        email: "mai.nguyen@example.com",
        password: "secret1",
        fullName: "Mai Nguyen",
        employeeCodeClaim: "DEV-024",
      }),
    ).toEqual({
      ok: true,
      value: {
        email: "mai.nguyen@example.com",
        password: "secret1",
        fullName: "Mai Nguyen",
        employeeCodeClaim: "DEV-024",
      },
    });
  });

  it("rejects invalid registration claims without exposing sensitive values", () => {
    expect(
      validateRegistration({
        email: "not-an-email",
        password: "short",
        fullName: "",
        employeeCodeClaim: "",
      }),
    ).toEqual({
      ok: false,
      code: "INVALID_REGISTRATION",
      message: "Enter a valid work email, name, employee code, and password.",
    });
  });
});

describe("account access gate", () => {
  it("routes an authenticated pending employee to the approval state", () => {
    expect(getAccountAccess({ accountStatus: "pending_approval" })).toEqual({
      kind: "pending_approval",
      canAccessWorkspace: false,
    });
  });

  it("allows only active employees into the workspace", () => {
    expect(getAccountAccess({ accountStatus: "active" })).toEqual({
      kind: "active",
      canAccessWorkspace: true,
    });
  });

  it("blocks disabled accounts and anonymous sessions", () => {
    expect(getAccountAccess({ accountStatus: "disabled" })).toEqual({
      kind: "disabled",
      canAccessWorkspace: false,
    });
    expect(getAccountAccess(null)).toEqual({
      kind: "unauthenticated",
      canAccessWorkspace: false,
    });
  });

  it("does not treat a signed-in account without an employee draft as pending approval", () => {
    expect(getAuthenticatedAccountAccess(null)).toEqual({
      kind: "registration_incomplete",
      canAccessWorkspace: false,
    });
  });

  it("uses one destination map for every account state", () => {
    expect(getAccountDestination({ kind: "active", canAccessWorkspace: true }, "/tasks")).toBe("/tasks");
    expect(getAccountDestination({ kind: "pending_approval", canAccessWorkspace: false })).toBe("/pending");
    expect(getAccountDestination({ kind: "disabled", canAccessWorkspace: false })).toBe("/account-status");
  });
});
