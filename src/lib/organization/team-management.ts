export type ManagedTeam = {
  id: string;
  name: string;
  code: string;
  parentTeamId: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
};

export type TeamManagementInput = {
  name: string;
  code: string;
  parentTeamId: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
};

export type TeamValidationCode = "INVALID_TEAM_ID" | "INVALID_TEAM_INPUT";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: TeamValidationCode };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function readUuid(value: unknown): string | null {
  const candidate = cleanText(value);
  return candidate && UUID_PATTERN.test(candidate) ? candidate : null;
}

function readNullableUuid(value: unknown): string | null {
  const candidate = cleanText(value);
  return candidate ? readUuid(candidate) : null;
}

function readMetadata(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function validateTeamId(teamId: unknown): ValidationResult<string> {
  const value = readUuid(teamId);

  return value ? { ok: true, value } : { ok: false, code: "INVALID_TEAM_ID" };
}

export function validateTeamManagementInput(input: Record<string, unknown> | null): ValidationResult<TeamManagementInput> {
  const name = cleanText(input?.name);
  const code = cleanText(input?.code).toUpperCase();
  const parentTeamId = readNullableUuid(input?.parentTeamId);
  const parentTeamIdInput = cleanText(input?.parentTeamId);
  const description = nullableText(input?.description);
  const metadata = readMetadata(input?.metadata);
  const isActive = typeof input?.isActive === "boolean" ? input.isActive : true;

  if (
    name.length < 2 ||
    name.length > 160 ||
    code.length < 2 ||
    code.length > 64 ||
    (parentTeamIdInput.length > 0 && !parentTeamId) ||
    (description?.length ?? 0) > 500 ||
    metadata === null
  ) {
    return { ok: false, code: "INVALID_TEAM_INPUT" };
  }

  return {
    ok: true,
    value: {
      name,
      code,
      parentTeamId,
      description,
      metadata,
      isActive,
    },
  };
}
