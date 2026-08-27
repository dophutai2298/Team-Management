import "server-only";

import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

import { readInsForgePublicEnv } from "./public-env";

export async function createInsForgeServerClient() {
  const env = readInsForgePublicEnv();

  return createServerClient({
    baseUrl: env.baseUrl,
    anonKey: env.anonKey,
    cookies: await cookies(),
  });
}
