function readStringProperty(error: object, key: string): string {
  return key in error ? String((error as Record<string, unknown>)[key] ?? "") : "";
}

export function isOptionalTaskCollaborationSchemaError(error: unknown): boolean {
  const details = [
    error instanceof Error ? error.message : "",
    typeof error === "object" && error ? readStringProperty(error, "message") : "",
    typeof error === "object" && error ? readStringProperty(error, "code") : "",
    typeof error === "object" && error ? readStringProperty(error, "error") : "",
    typeof error === "object" && error ? readStringProperty(error, "details") : "",
    typeof error === "object" && error ? readStringProperty(error, "hint") : "",
  ]
    .join(" ")
    .toLowerCase();
  const mentionsCollaborationTable =
    details.includes("task_comments") ||
    details.includes("task_attachments") ||
    details.includes("account_audit_events");

  return (
    mentionsCollaborationTable &&
    (details.includes("does not exist") ||
      details.includes("could not find") ||
      details.includes("schema cache") ||
      details.includes("relation") ||
      details.includes("pgrst204") ||
      details.includes("pgrst205"))
  );
}

