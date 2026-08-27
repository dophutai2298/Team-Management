import type { NextConfig } from "next";

const requiredInsForgeEnv = [
  "NEXT_PUBLIC_INSFORGE_URL",
  "NEXT_PUBLIC_INSFORGE_ANON_KEY",
  "INSFORGE_URL",
  "INSFORGE_API_KEY",
] as const;

for (const key of requiredInsForgeEnv) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

for (const key of ["NEXT_PUBLIC_INSFORGE_API_KEY", "NEXT_PUBLIC_INSFORGE_ADMIN_KEY"] as const) {
  if (process.env[key]?.trim()) {
    throw new Error(`${key} must not be defined. InsForge admin credentials are server-only.`);
  }
}

for (const key of ["NEXT_PUBLIC_INSFORGE_URL", "INSFORGE_URL"] as const) {
  try {
    const url = new URL(process.env[key] ?? "");

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new Error(`${key} must be a valid HTTP(S) URL.`);
  }
}

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
};

export default nextConfig;
