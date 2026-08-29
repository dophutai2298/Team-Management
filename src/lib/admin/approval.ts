export type PendingAccount = {
  id: string;
  fullName: string;
  email: string;
  employeeCodeClaim: string;
  requestedAt: string;
};

export type OrganizationOption = {
  id: string;
  name: string;
  detail?: string;
};

export type ApprovalOptions = {
  teams: OrganizationOption[];
  roles: OrganizationOption[];
  managers: OrganizationOption[];
};

export type ApprovalInput = {
  employeeCode: string;
  teamId: string;
  managerEmployeeId: string;
  roleId: string;
  positionTitle: string | null;
  levelName: string | null;
};

export type RejectionInput = {
  reason: string;
};

export type AdminValidationCode =
  | "INVALID_ACCOUNT_ID"
  | "INVALID_APPROVAL_INPUT"
  | "INVALID_REJECTION_INPUT";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: AdminValidationCode };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredUuid(value: unknown): string | null {
  const candidate = cleanText(value);
  return UUID_PATTERN.test(candidate) ? candidate : null;
}

export function validateApprovalInput(
  employeeId: unknown,
  input: Record<string, unknown> | null,
): ValidationResult<ApprovalInput> {
  if (!readRequiredUuid(employeeId)) {
    return { ok: false, code: "INVALID_ACCOUNT_ID" };
  }

  const employeeCode = cleanText(input?.employeeCode).toUpperCase();
  const teamId = readRequiredUuid(input?.teamId);
  const managerEmployeeId = readRequiredUuid(input?.managerEmployeeId);
  const roleId = readRequiredUuid(input?.roleId);
  const positionTitle = cleanText(input?.positionTitle);
  const levelName = cleanText(input?.levelName);

  if (
    employeeCode.length < 2 ||
    employeeCode.length > 64 ||
    !teamId ||
    !managerEmployeeId ||
    !roleId ||
    positionTitle.length > 120 ||
    levelName.length > 120
  ) {
    return {
      ok: false,
      code: "INVALID_APPROVAL_INPUT",
    };
  }

  return {
    ok: true,
    value: {
      employeeCode,
      teamId,
      managerEmployeeId,
      roleId,
      positionTitle: positionTitle || null,
      levelName: levelName || null,
    },
  };
}

export function validateRejectionInput(
  employeeId: unknown,
  input: Record<string, unknown> | null,
): ValidationResult<RejectionInput> {
  if (!readRequiredUuid(employeeId)) {
    return { ok: false, code: "INVALID_ACCOUNT_ID" };
  }

  const reason = cleanText(input?.reason);

  if (reason.length < 3 || reason.length > 500) {
    return { ok: false, code: "INVALID_REJECTION_INPUT" };
  }

  return { ok: true, value: { reason } };
}
