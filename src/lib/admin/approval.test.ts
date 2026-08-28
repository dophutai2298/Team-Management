import { describe, expect, it } from "vitest";

import { validateApprovalInput, validateRejectionInput } from "./approval";

const employeeId = "8ce2d2d2-44f9-4d2c-b06e-47695795a7c9";
const teamId = "4ad08f16-bd50-4e5d-834a-3b0c5b8e8a23";
const managerId = "8460e195-0b3d-44db-bff9-f5a829d5d596";
const roleId = "604ebf0a-3b97-4d4c-92cd-75fbc13b582d";

describe("admin approval input", () => {
  it("normalizes an official employee code and preserves the organization choices", () => {
    expect(
      validateApprovalInput(employeeId, {
        employeeCode: " dev-024 ",
        teamId,
        managerEmployeeId: managerId,
        roleId,
        positionTitle: "Software Engineer",
        levelName: "L2",
      }),
    ).toEqual({
      ok: true,
      value: {
        employeeCode: "DEV-024",
        teamId,
        managerEmployeeId: managerId,
        roleId,
        positionTitle: "Software Engineer",
        levelName: "L2",
      },
    });
  });

  it("rejects approval when required organization data is missing", () => {
    expect(
      validateApprovalInput(employeeId, {
        employeeCode: "DEV-024",
        teamId: "not-a-uuid",
        roleId,
        positionTitle: "",
        levelName: "",
      }),
    ).toEqual({
      ok: false,
      code: "INVALID_APPROVAL_INPUT",
    });
  });

  it("requires a concise reason when rejecting an account", () => {
    expect(validateRejectionInput(employeeId, { reason: "No" })).toEqual({
      ok: false,
      code: "INVALID_REJECTION_INPUT",
    });
    expect(validateRejectionInput(employeeId, { reason: "Employee code could not be verified." })).toEqual({
      ok: true,
      value: { reason: "Employee code could not be verified." },
    });
  });
});
