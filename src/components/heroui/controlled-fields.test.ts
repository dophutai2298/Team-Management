import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("controlled select focus behavior", () => {
  it("does not configure searchable selects to open from focus alone", () => {
    const source = readFileSync(new URL("./controlled-fields.tsx", import.meta.url), "utf8");

    expect(source).not.toContain('menuTrigger="focus"');
    expect(source).toContain('menuTrigger="manual"');
  });
});
