import { type NextRequest } from "next/server";

import { getEmailDomain, validateRegistration } from "@/lib/auth/access";
import { createRegistrationClaim, isAllowedEmailDomain } from "@/lib/auth/repository";
import {
  createAuthFailure,
  createAuthResponse,
  createRequestAuthActions,
  readJsonBody,
} from "@/lib/auth/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validation = validateRegistration(body ?? {});

  if (!validation.ok) {
    return createAuthFailure(validation.code, validation.message, 400);
  }

  const domain = getEmailDomain(validation.value.email);

  if (!domain || !(await isAllowedEmailDomain(domain))) {
    return createAuthFailure(
      "EMAIL_DOMAIN_NOT_ALLOWED",
      "Registration is available only to configured company email domains.",
      403,
    );
  }

  try {
    await createRegistrationClaim(validation.value);
  } catch {
    return createAuthFailure(
      "REGISTRATION_SETUP_FAILED",
      "Your registration could not be prepared. Please try again.",
      503,
    );
  }

  const response = createAuthResponse({
    email: validation.value.email,
    next: "/verify-email",
  });
  const auth = createRequestAuthActions(request, response);
  const { data, error } = await auth.signUp({
    email: validation.value.email,
    password: validation.value.password,
    name: validation.value.fullName,
  });
  const registrationAccepted = data?.requireEmailVerification === true || Boolean(data?.user?.id);

  if (error || !registrationAccepted) {
    return createAuthFailure(
      error?.statusCode === 409 ? "EMAIL_ALREADY_REGISTERED" : "REGISTRATION_FAILED",
      error?.statusCode === 409
        ? "This work email is already registered. Sign in instead."
        : "We could not create your account. Please try again.",
      error?.statusCode ?? 400,
    );
  }

  return response;
}
