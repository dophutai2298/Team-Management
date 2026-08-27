import "server-only";

import {
  assertNoPublicAdminKey,
  readHttpUrl,
  readInsForgePublicEnv,
  readRequiredEnv,
  type InsForgePublicEnv,
  type RuntimeEnv,
} from "./env-shared";

export type InsForgeServerEnv = InsForgePublicEnv & {
  serverBaseUrl: string;
  apiKey: string;
};

export function readInsForgeServerEnv(env: RuntimeEnv = process.env): InsForgeServerEnv {
  assertNoPublicAdminKey(env);

  return {
    ...readInsForgePublicEnv(env),
    serverBaseUrl: readHttpUrl(env, "INSFORGE_URL"),
    apiKey: readRequiredEnv(env, "INSFORGE_API_KEY"),
  };
}
