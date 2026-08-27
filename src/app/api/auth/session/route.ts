import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth/session";
import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const actor = await getCurrentActor();

    if (!actor) {
      return NextResponse.json(apiSuccess({ authenticated: false, access: "unauthenticated" }));
    }

    return NextResponse.json(
      apiSuccess({
        authenticated: true,
        email: actor.email,
        access: actor.access.kind,
      }),
    );
  } catch {
    return NextResponse.json(
      apiFailure("SESSION_UNAVAILABLE", "We could not verify your session. Please try again."),
      { status: 503 },
    );
  }
}
