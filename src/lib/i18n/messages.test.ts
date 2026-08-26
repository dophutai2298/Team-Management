import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, FALLBACK_LOCALE, resolveMessage } from "./messages";

describe("i18n message resolution", () => {
  it("uses Vietnamese by default and English as fallback", () => {
    expect(DEFAULT_LOCALE).toBe("vi");
    expect(FALLBACK_LOCALE).toBe("en");
  });

  it("returns the selected locale message when available", () => {
    expect(resolveMessage("vi", "dashboard.title")).toBe("Tổng quan");
  });

  it("falls back to English when a Vietnamese message is unavailable", () => {
    expect(resolveMessage("vi", "dashboard.englishOnlyHint")).toBe(
      "Your workspace is ready.",
    );
  });
});
