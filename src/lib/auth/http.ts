import { NextResponse, type NextRequest } from "next/server";

import { createAuthActions } from "@insforge/sdk/ssr";

import { apiFailure, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { readInsForgePublicEnv } from "@/lib/insforge/public-env";

import { getSafeInternalPath } from "./access";

export function createAuthResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json(apiSuccess(data));
}

export function withAuthCookies<T>(response: NextResponse, data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json(apiSuccess(data), { headers: response.headers });
}

export function createAuthFailure(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(apiFailure(code, message), { status });
}

export function createRequestAuthActions(
  request: NextRequest,
  response: NextResponse,
) {
  const env = readInsForgePublicEnv();

  return createAuthActions({
    baseUrl: env.baseUrl,
    anonKey: env.anonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();

    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export { getSafeInternalPath };
