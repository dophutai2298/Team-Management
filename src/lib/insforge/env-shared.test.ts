import { describe, expect, it, vi } from "vitest";

import {
  InsForgeEnvError,
  readInsForgePublicEnv,
  type RuntimeEnv,
} from "./env-shared";

vi.mock("server-only", () => ({}));

const validEnv: RuntimeEnv = {
  NEXT_PUBLIC_INSFORGE_URL: "https://hgj97xsa.ap-southeast.insforge.app/",
  NEXT_PUBLIC_INSFORGE_ANON_KEY: "anon-key",
  INSFORGE_URL: "https://hgj97xsa.ap-southeast.insforge.app/",
  INSFORGE_API_KEY: "server-key",
};

describe("InsForge env contract", () => {
  it("normalizes public InsForge configuration for browser-safe clients", () => {
    expect(readInsForgePublicEnv(validEnv)).toEqual({
      baseUrl: "https://hgj97xsa.ap-southeast.insforge.app",
      anonKey: "anon-key",
    });
  });

  it("keeps server-only admin configuration separate from public env", async () => {
    const { readInsForgeServerEnv } = await import("./server-env");

    expect(readInsForgeServerEnv(validEnv)).toEqual({
      baseUrl: "https://hgj97xsa.ap-southeast.insforge.app",
      anonKey: "anon-key",
      serverBaseUrl: "https://hgj97xsa.ap-southeast.insforge.app",
      apiKey: "server-key",
    });
  });

  it("throws a keyed error when required configuration is missing", () => {
    expect(() =>
      readInsForgePublicEnv({
        NEXT_PUBLIC_INSFORGE_URL: "https://hgj97xsa.ap-southeast.insforge.app",
      }),
    ).toThrow(InsForgeEnvError);
  });

  it("rejects public admin key variables to avoid client bundle leaks", async () => {
    const { readInsForgeServerEnv } = await import("./server-env");

    expect(() =>
      readInsForgeServerEnv({
        ...validEnv,
        NEXT_PUBLIC_INSFORGE_API_KEY: "do-not-expose",
      }),
    ).toThrow(/server-only/);
  });
});
