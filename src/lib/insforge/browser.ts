"use client";

import { createBrowserClient } from "@insforge/sdk/ssr";

import { readInsForgePublicEnv } from "./public-env";

type InsForgeBrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: InsForgeBrowserClient | null = null;

export function getInsForgeBrowserClient(): InsForgeBrowserClient {
  if (!browserClient) {
    const env = readInsForgePublicEnv();

    browserClient = createBrowserClient({
      baseUrl: env.baseUrl,
      anonKey: env.anonKey,
    });
  }

  return browserClient;
}
