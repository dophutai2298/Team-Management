import { describe, expect, it } from "vitest";

import { createScopedQueryKey } from "./query-client";

describe("query cache scoping", () => {
  it("keeps auth-scoped queries separate between users", () => {
    expect(createScopedQueryKey("admin-user", "tasks")).not.toEqual(createScopedQueryKey("employee-user", "tasks"));
    expect(createScopedQueryKey("admin-user", "tasks", "task-1")).not.toEqual(
      createScopedQueryKey("employee-user", "tasks", "task-1"),
    );
  });
});
