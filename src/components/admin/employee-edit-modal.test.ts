import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("employee edit modal submit behavior", () => {
  it("does not auto-focus the active memberships combobox when submit validation fails", () => {
    const source = readFileSync(new URL("./employee-edit-modal.tsx", import.meta.url), "utf8");

    expect(source).toContain("shouldFocusError: false");
    expect(source).toContain('type="button"');
  });
});
