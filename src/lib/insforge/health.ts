import "server-only";

import { getInsForgeAdminClient } from "./admin";
import { readInsForgeServerEnv } from "./server-env";

export type InsForgeBackendHealth = {
  service: "insforge";
  status: "reachable";
  baseUrl: string;
  latencyMs: number;
};

export async function checkInsForgeBackendHealth(): Promise<InsForgeBackendHealth> {
  const env = readInsForgeServerEnv();
  const startedAt = Date.now();
  const { error } = await getInsForgeAdminClient().auth.getPublicAuthConfig();

  if (error) {
    throw error;
  }

  return {
    service: "insforge",
    status: "reachable",
    baseUrl: env.serverBaseUrl,
    latencyMs: Math.max(0, Date.now() - startedAt),
  };
}
