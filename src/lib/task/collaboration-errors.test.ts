import { describe, expect, it } from "vitest";

import { isOptionalTaskCollaborationSchemaError } from "./collaboration-errors";

describe("optional task collaboration schema errors", () => {
  it("detects PostgREST plain-object missing table errors", () => {
    expect(
      isOptionalTaskCollaborationSchemaError({
        code: "PGRST205",
        message: "Could not find the table 'public.task_comments' in the schema cache",
      }),
    ).toBe(true);
  });

  it("detects missing collaboration columns during partial migrations", () => {
    expect(
      isOptionalTaskCollaborationSchemaError({
        code: "PGRST204",
        message: "Could not find the 'removed_at' column of 'task_attachments' in the schema cache",
      }),
    ).toBe(true);
  });

  it("does not hide unrelated task errors", () => {
    expect(
      isOptionalTaskCollaborationSchemaError({
        code: "42501",
        message: "permission denied for table tasks",
      }),
    ).toBe(false);
  });
});

