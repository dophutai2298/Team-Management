import "server-only";

import { createAdminClient, type InsForgeClient } from "@insforge/sdk";

import { readInsForgeServerEnv } from "./server-env";

let adminClient: InsForgeClient | null = null;

export function getInsForgeAdminClient(): InsForgeClient {
  if (!adminClient) {
    const env = readInsForgeServerEnv();

    adminClient = createAdminClient({
      baseUrl: env.serverBaseUrl,
      apiKey: env.apiKey,
    });
  }

  return adminClient;
}
