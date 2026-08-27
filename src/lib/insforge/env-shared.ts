export type RuntimeEnv = Record<string, string | undefined>;

export type InsForgePublicEnv = {
  baseUrl: string;
  anonKey: string;
};

export class InsForgeEnvError extends Error {
  readonly key: string;

  constructor(key: string, message: string) {
    super(message);
    this.name = "InsForgeEnvError";
    this.key = key;
  }
}

export function readRequiredEnv(env: RuntimeEnv, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new InsForgeEnvError(key, `Missing required environment variable: ${key}`);
  }

  return value;
}

export function readHttpUrl(env: RuntimeEnv, key: string): string {
  const value = readRequiredEnv(env, key);

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    throw new InsForgeEnvError(key, `${key} must be a valid HTTP(S) URL.`);
  }
}

export function assertNoPublicAdminKey(env: RuntimeEnv): void {
  for (const key of ["NEXT_PUBLIC_INSFORGE_API_KEY", "NEXT_PUBLIC_INSFORGE_ADMIN_KEY"]) {
    if (env[key]?.trim()) {
      throw new InsForgeEnvError(
        key,
        `${key} must not be defined. InsForge admin credentials are server-only.`,
      );
    }
  }
}

export function readInsForgePublicEnv(env: RuntimeEnv = process.env): InsForgePublicEnv {
  return {
    baseUrl: readHttpUrl(env, "NEXT_PUBLIC_INSFORGE_URL"),
    anonKey: readRequiredEnv(env, "NEXT_PUBLIC_INSFORGE_ANON_KEY"),
  };
}
