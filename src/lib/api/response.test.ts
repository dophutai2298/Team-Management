import { describe, expect, it } from "vitest";

import { apiFailure, apiSuccess } from "./response";

describe("API response contract", () => {
  it("wraps successful data in the shared success shape", () => {
    expect(apiSuccess({ status: "ok" })).toEqual({
      ok: true,
      data: { status: "ok" },
    });
  });

  it("omits error details unless the caller provides them", () => {
    expect(apiFailure("NOT_FOUND", "Resource not found")).toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    });
  });

  it("preserves safe error details when provided", () => {
    expect(apiFailure("INVALID_INPUT", "Invalid input", { field: "name" })).toEqual({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid input",
        details: { field: "name" },
      },
    });
  });
});
