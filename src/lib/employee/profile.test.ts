import { describe, expect, it } from "vitest";

import { validateAdminEmployeeInput, validateEmployeeProfileInput } from "./profile";

const employeeId = "8ce2d2d2-44f9-4d2c-b06e-47695795a7c9";
const teamId = "4ad08f16-bd50-4e5d-834a-3b0c5b8e8a23";
const managerId = "8460e195-0b3d-44db-bff9-f5a829d5d596";
const roleId = "604ebf0a-3b97-4d4c-92cd-75fbc13b582d";

describe("employee profile input", () => {
  it("accepts personal profile fields and normalizes optional blanks", () => {
    expect(
      validateEmployeeProfileInput({
        fullName: "  New Employee ",
        birthday: "1998-02-22",
        phone: "",
        address: "District 1",
        hometown: "Da Nang",
        avatarUrl: "",
        timezone: "Asia/Saigon",
        locale: "EN",
      }),
    ).toEqual({
      ok: true,
      value: {
        fullName: "New Employee",
        birthday: "1998-02-22",
        phone: null,
        address: "District 1",
        hometown: "Da Nang",
        avatarUrl: null,
        timezone: "Asia/Saigon",
        locale: "en",
      },
    });
  });

  it("rejects invalid profile dates and locales", () => {
    expect(validateEmployeeProfileInput({ fullName: "A", birthday: "2026-99-99", timezone: "UTC", locale: "jp" })).toEqual({
      ok: false,
      code: "INVALID_EMPLOYEE_PROFILE_INPUT",
    });
  });
});

describe("admin employee input", () => {
  it("normalizes official employee management fields", () => {
    expect(
      validateAdminEmployeeInput(employeeId, {
        employeeCode: " dev-024 ",
        teamId,
        teamIds: [teamId, teamId],
        managerEmployeeId: managerId,
        roleId,
        positionTitle: "",
        levelName: " L2 ",
        accountStatus: "ACTIVE",
      }),
    ).toEqual({
      ok: true,
      value: {
        employeeCode: "DEV-024",
        teamId,
        teamIds: [teamId],
        managerEmployeeId: managerId,
        roleId,
        positionTitle: null,
        levelName: "L2",
        accountStatus: "active",
      },
    });
  });

  it("preserves lifecycle state instead of accepting pending approval as a management target", () => {
    expect(
      validateAdminEmployeeInput(employeeId, {
        employeeCode: "DEV-024",
        teamId,
        teamIds: [teamId],
        managerEmployeeId: "",
        roleId,
        positionTitle: "",
        levelName: "",
        accountStatus: "pending_approval",
      }),
    ).toEqual({
      ok: false,
      code: "INVALID_EMPLOYEE_MANAGEMENT_INPUT",
    });
  });
});
