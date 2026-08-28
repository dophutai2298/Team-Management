import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  createRegistrationClaim: vi.fn(),
  isAllowedEmailDomain: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/auth/repository", () => ({
  createRegistrationClaim: mocks.createRegistrationClaim,
  isAllowedEmailDomain: mocks.isAllowedEmailDomain,
}));

vi.mock("@/lib/auth/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/http")>();

  return {
    ...actual,
    createRequestAuthActions: () => ({ signUp: mocks.signUp }),
  };
});

function createRegistrationRequest() {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "new.employee@gmail.com",
      password: "Secret123",
      fullName: "New Employee",
      employeeCodeClaim: "EMP-123",
    }),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mocks.createRegistrationClaim.mockReset();
    mocks.isAllowedEmailDomain.mockReset();
    mocks.signUp.mockReset();
    mocks.isAllowedEmailDomain.mockResolvedValue(true);
    mocks.createRegistrationClaim.mockResolvedValue(undefined);
  });

  it("continues to email verification when InsForge requires email verification", async () => {
    mocks.signUp.mockResolvedValue({
      data: { requireEmailVerification: true },
      error: null,
    });

    const response = await POST(createRegistrationRequest() as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      data: {
        email: "new.employee@gmail.com",
        next: "/verify-email",
      },
    });
  });
});
