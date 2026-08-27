export const ACCOUNT_STATUSES = [
  "pending_approval",
  "active",
  "disabled",
  "terminated",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type AccountAccess =
  | { kind: "unauthenticated"; canAccessWorkspace: false }
  | { kind: "registration_incomplete"; canAccessWorkspace: false }
  | { kind: "pending_approval"; canAccessWorkspace: false }
  | { kind: "active"; canAccessWorkspace: true }
  | { kind: "disabled"; canAccessWorkspace: false }
  | { kind: "terminated"; canAccessWorkspace: false };

type RegistrationInput = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  employeeCodeClaim?: unknown;
};

export type RegistrationClaim = {
  email: string;
  password: string;
  fullName: string;
  employeeCodeClaim: string;
};

type RegistrationValidation =
  | { ok: true; value: RegistrationClaim }
  | { ok: false; code: "INVALID_REGISTRATION"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_REGISTRATION_MESSAGE =
  "Enter a valid work email, name, employee code, and password.";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getEmailDomain(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return null;
  }

  return normalizedEmail.slice(normalizedEmail.lastIndexOf("@") + 1);
}

export function validateRegistration(input: RegistrationInput): RegistrationValidation {
  const email = cleanText(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  const fullName = cleanText(input.fullName);
  const employeeCodeClaim = cleanText(input.employeeCodeClaim).toUpperCase();

  if (
    !getEmailDomain(email) ||
    password.length < 6 ||
    fullName.length < 2 ||
    employeeCodeClaim.length < 2
  ) {
    return {
      ok: false,
      code: "INVALID_REGISTRATION",
      message: INVALID_REGISTRATION_MESSAGE,
    };
  }

  return {
    ok: true,
    value: {
      email,
      password,
      fullName,
      employeeCodeClaim,
    },
  };
}

export function getAccountAccess(
  employee: { accountStatus: AccountStatus } | null,
): AccountAccess {
  if (!employee) {
    return { kind: "unauthenticated", canAccessWorkspace: false };
  }

  return {
    kind: employee.accountStatus,
    canAccessWorkspace: employee.accountStatus === "active",
  } as AccountAccess;
}

export function getAuthenticatedAccountAccess(
  employee: { accountStatus: AccountStatus } | null,
): AccountAccess {
  return employee
    ? getAccountAccess(employee)
    : { kind: "registration_incomplete", canAccessWorkspace: false };
}

export function getSafeInternalPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function getAccountDestination(access: AccountAccess, activeDestination = "/dashboard"): string {
  if (access.canAccessWorkspace) {
    return activeDestination;
  }

  if (access.kind === "pending_approval") {
    return "/pending";
  }

  return access.kind === "unauthenticated" ? "/login" : "/account-status";
}
