import { type NextRequest } from "next/server";

import { createAuthResponse, createRequestAuthActions } from "@/lib/auth/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = createAuthResponse({ next: "/login" });
  const auth = createRequestAuthActions(request, response);
  const { error } = await auth.signOut();

  if (error) {
    return response;
  }

  return response;
}
