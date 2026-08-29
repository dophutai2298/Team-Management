import { ACCOUNT_STATUSES, type AccountStatus } from "@/lib/auth/access";
import type { Locale } from "@/lib/i18n/messages";

export type EmployeeProfile = {
  id: string;
  email: string;
  fullName: string;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  hometown: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: Locale;
  employeeCode: string | null;
  roleName: string | null;
  teamName: string | null;
  managerName: string | null;
  positionTitle: string | null;
  levelName: string | null;
  accountStatus: AccountStatus;
};

export type EmployeeSummary = EmployeeProfile & {
  roleId: string | null;
  teamId: string | null;
  managerEmployeeId: string | null;
  updatedAt: string;
  createdAt: string;
};

export type EmployeeManagementOptions = {
  teams: { id: string; name: string; detail?: string }[];
  roles: { id: string; name: string; detail?: string }[];
  managers: { id: string; name: string; detail?: string }[];
};

export type EmployeeProfileInput = {
  fullName: string;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  hometown: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: Locale;
};

export type AdminEmployeeInput = {
  employeeCode: string;
  teamId: string;
  managerEmployeeId: string | null;
  roleId: string;
  positionTitle: string | null;
  levelName: string | null;
  accountStatus: Exclude<AccountStatus, "pending_approval">;
};

export type EmployeeValidationCode =
  | "INVALID_EMPLOYEE_ID"
  | "INVALID_EMPLOYEE_PROFILE_INPUT"
  | "INVALID_EMPLOYEE_MANAGEMENT_INPUT";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; code: EmployeeValidationCode };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PROFILE_LOCALES = ["vi", "en"] as const;
const MANAGED_ACCOUNT_STATUSES = ACCOUNT_STATUSES.filter(
  (status): status is Exclude<AccountStatus, "pending_approval"> => status !== "pending_approval",
);

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function readUuid(value: unknown): string | null {
  const candidate = cleanText(value);
  return UUID_PATTERN.test(candidate) ? candidate : null;
}

function readNullableUuid(value: unknown): string | null {
  const candidate = cleanText(value);
  return candidate ? readUuid(candidate) : null;
}

function readDate(value: unknown): string | null {
  const candidate = cleanText(value);
  if (!candidate) return null;
  if (!DATE_PATTERN.test(candidate)) return "";

  const date = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== candidate ? "" : candidate;
}

export function validateEmployeeProfileInput(input: Record<string, unknown> | null): ValidationResult<EmployeeProfileInput> {
  const fullName = cleanText(input?.fullName);
  const birthday = readDate(input?.birthday);
  const phone = nullableText(input?.phone);
  const address = nullableText(input?.address);
  const hometown = nullableText(input?.hometown);
  const avatarUrl = nullableText(input?.avatarUrl);
  const timezone = cleanText(input?.timezone) || "Asia/Saigon";
  const locale = cleanText(input?.locale).toLowerCase();

  if (
    fullName.length < 2 ||
    fullName.length > 160 ||
    birthday === "" ||
    (phone?.length ?? 0) > 40 ||
    (address?.length ?? 0) > 240 ||
    (hometown?.length ?? 0) > 120 ||
    (avatarUrl?.length ?? 0) > 500 ||
    timezone.length < 2 ||
    timezone.length > 80 ||
    !PROFILE_LOCALES.includes(locale as Locale)
  ) {
    return { ok: false, code: "INVALID_EMPLOYEE_PROFILE_INPUT" };
  }

  return {
    ok: true,
    value: {
      fullName,
      birthday,
      phone,
      address,
      hometown,
      avatarUrl,
      timezone,
      locale: locale as Locale,
    },
  };
}

export function validateAdminEmployeeInput(
  employeeId: unknown,
  input: Record<string, unknown> | null,
): ValidationResult<AdminEmployeeInput> {
  if (!readUuid(employeeId)) {
    return { ok: false, code: "INVALID_EMPLOYEE_ID" };
  }

  const employeeCode = cleanText(input?.employeeCode).toUpperCase();
  const teamId = readUuid(input?.teamId);
  const managerEmployeeId = readNullableUuid(input?.managerEmployeeId);
  const roleId = readUuid(input?.roleId);
  const positionTitle = nullableText(input?.positionTitle);
  const levelName = nullableText(input?.levelName);
  const accountStatus = cleanText(input?.accountStatus).toLowerCase() as AdminEmployeeInput["accountStatus"];

  if (
    employeeCode.length < 2 ||
    employeeCode.length > 64 ||
    !teamId ||
    !roleId ||
    (positionTitle?.length ?? 0) > 120 ||
    (levelName?.length ?? 0) > 120 ||
    !MANAGED_ACCOUNT_STATUSES.includes(accountStatus)
  ) {
    return { ok: false, code: "INVALID_EMPLOYEE_MANAGEMENT_INPUT" };
  }

  return {
    ok: true,
    value: {
      employeeCode,
      teamId,
      managerEmployeeId,
      roleId,
      positionTitle,
      levelName,
      accountStatus,
    },
  };
}
