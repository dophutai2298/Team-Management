import { type NextRequest } from "next/server";

import { getEmailDomain } from "@/lib/auth/access";
import {
  createPendingEmployee,
  deleteRegistrationClaim,
  getRegistrationClaim,
  isAllowedEmailDomain,
} from "@/lib/auth/repository";
import {
  createAuthFailure,
  createAuthResponse,
  createRequestAuthActions,
  readJsonBody,
} from "@/lib/auth/http";

export const dynamic = "force-dynamic";

function getVerificationInput(body: Record<string, unknown> | null) {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  return { email, otp };
}

export async function POST(request: NextRequest) {
  const input = getVerificationInput(await readJsonBody(request));

  if (!getEmailDomain(input.email) || !/^\d{6}$/.test(input.otp)) {
    return createAuthFailure("INVALID_VERIFICATION", "Enter the 6-digit code from your email.", 400);
  }

  const response = createAuthResponse({ next: "/pending" });
  const auth = createRequestAuthActions(request, response);
  const { data, error } = await auth.verifyEmail(input);

  if (error || !data?.user?.id) {
    return createAuthFailure(
      "INVALID_OR_EXPIRED_OTP",
      "That verification code is invalid or has expired. Request a new code and try again.",
      error?.statusCode ?? 400,
    );
  }

  const claim = await getRegistrationClaim(data.user.id);

  if (!claim || claim.email !== input.email) {
    return createAuthFailure(
      "REGISTRATION_CLAIM_NOT_FOUND",
      "Your registration details could not be found. Contact an administrator for help.",
      409,
    );
  }

  const domain = getEmailDomain(claim.email);

  if (!domain || !(await isAllowedEmailDomain(domain))) {
    return createAuthFailure(
      "EMAIL_DOMAIN_NOT_ALLOWED",
      "This email domain is no longer approved for registration. Contact an administrator.",
      403,
    );
  }

  try {
    await createPendingEmployee(claim);
    await deleteRegistrationClaim(data.user.id);
  } catch {
    return createAuthFailure(
      "PENDING_ACCOUNT_SETUP_FAILED",
      "Your verified account could not be placed in the approval queue. Contact an administrator.",
      503,
    );
  }

  return response;
}
