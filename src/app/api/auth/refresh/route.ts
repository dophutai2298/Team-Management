import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

import { readInsForgePublicEnv } from "@/lib/insforge/public-env";

const env = readInsForgePublicEnv();

export const { POST } = createRefreshAuthRouter({
  baseUrl: env.baseUrl,
  anonKey: env.anonKey,
});
