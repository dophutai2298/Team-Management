import { describe, expect, it } from "vitest";

import { validateTeamId, validateTeamManagementInput } from "./team-management";

const parentTeamId = "4ad08f16-bd50-4e5d-834a-3b0c5b8e8a23";

describe("team management input", () => {
  it("normalizes team metadata", () => {
    expect(
      validateTeamManagementInput({
        name: " Platform ",
        code: " plt ",
        parentTeamId,
        description: " Core systems ",
        metadata: { costCenter: "ENG" },
        isActive: false,
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Platform",
        code: "PLT",
        parentTeamId,
        description: "Core systems",
        metadata: { costCenter: "ENG" },
        isActive: false,
      },
    });
  });

  it("rejects invalid ids and metadata shapes", () => {
    expect(validateTeamId("not-a-team")).toEqual({ ok: false, code: "INVALID_TEAM_ID" });
    expect(validateTeamManagementInput({ name: "Platform", code: "PLT", parentTeamId: "bad-parent" })).toEqual({
      ok: false,
      code: "INVALID_TEAM_INPUT",
    });
    expect(validateTeamManagementInput({ name: "A", code: "B", metadata: [] })).toEqual({
      ok: false,
      code: "INVALID_TEAM_INPUT",
    });
  });
});
