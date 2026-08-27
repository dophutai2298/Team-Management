import { type NextRequest } from "next/server";

import { getAccountAccess } from "@/lib/auth/access";
import { getEmployeeAccount } from "@/lib/auth/repository";
import {
  createAuthFailure,
  createAuthResponse,
  createRequestAuthActions,
  getSafeInternalPath,
  readJsonBody,
  withAuthCookies,
} from "@/lib/auth/http";

export const dynamic = "force-dynamic";

function getSignInInput(body: Record<string, unknown> | null) {
  return {
    email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : "",
    password: typeof body?.password === "string" ? body.password : "",
    returnTo: getSafeInternalPath(body?.returnTo),
  };
}

export async function POST(request: NextRequest) {
  const input = getSignInInput(await readJsonBody(request));

  if (!input.email || !input.password) {
    return createAuthFailure("INVALID_SIGN_IN", "Enter your work email and password.", 400);
  }

  const response = createAuthResponse({ next: input.returnTo, access: "active" as const });
  const auth = createRequestAuthActions(request, response);
  const { data, error } = await auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data?.user?.id) {
    const needsVerification = error?.statusCode === 403;

    return createAuthFailure(
      needsVerification ? "EMAIL_VERIFICATION_REQUIRED" : "INVALID_CREDENTIALS",
      needsVerification
        ? "Verify your email before signing in."
        : "Your email or password is incorrect.",
      error?.statusCode ?? 401,
    );
  }

  const employee = await getEmployeeAccount(data.user.id);
  const access = getAccountAccess(employee ?? { accountStatus: "pending_approval" });
  const next = access.canAccessWorkspace
    ? input.returnTo
    : access.kind === "pending_approval"
      ? "/pending"
      : "/account-status";

  return withAuthCookies(response, { next, access: access.kind });
}
