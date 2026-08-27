"use client";

import { Button, Input } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import { getSafeInternalPath } from "@/lib/auth/access";
import { useLocale } from "@/lib/i18n/locale-provider";

import { AuthBackLink, AuthShell } from "./auth-shell";

type AuthResult = { next: string; access?: string; email?: string };

function getErrorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const signIn = useMutation({
    mutationFn: () =>
      fetchApi<AuthResult>("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnTo: getSafeInternalPath(searchParams.get("returnTo")),
        }),
      }),
    onSuccess: (result) => router.replace(result.next),
  });

  return (
    <AuthShell description={t("auth.signInDescription")} title={t("auth.signInTitle")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          signIn.mutate();
        }}
      >
        <Input
          isRequired
          autoComplete="email"
          label={t("auth.email")}
          radius="sm"
          type="email"
          value={email}
          onValueChange={setEmail}
        />
        <Input
          isRequired
          autoComplete="current-password"
          label={t("auth.password")}
          radius="sm"
          type="password"
          value={password}
          onValueChange={setPassword}
        />
        {signIn.isError ? <p aria-live="polite" className="text-sm text-danger">{getErrorMessage(signIn.error)}</p> : null}
        <Button className="h-10 w-full font-medium" color="primary" isLoading={signIn.isPending} radius="sm" type="submit">
          {signIn.isPending ? t("auth.loading") : t("auth.signIn")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.needAccount")} {" "}
        <Link className="font-medium text-primary" href="/register">
          {t("auth.createAccount")}
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegistrationForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeCodeClaim, setEmployeeCodeClaim] = useState("");
  const register = useMutation({
    mutationFn: () =>
      fetchApi<AuthResult>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, employeeCodeClaim }),
      }),
    onSuccess: (result) => router.push(`${result.next}?email=${encodeURIComponent(result.email ?? email)}`),
  });

  return (
    <AuthShell description={t("auth.registerDescription")} title={t("auth.registerTitle")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          register.mutate();
        }}
      >
        <Input isRequired label={t("auth.fullName")} radius="sm" value={fullName} onValueChange={setFullName} />
        <Input
          isRequired
          autoComplete="email"
          label={t("auth.email")}
          radius="sm"
          type="email"
          value={email}
          onValueChange={setEmail}
        />
        <Input
          isRequired
          label={t("auth.employeeCode")}
          radius="sm"
          value={employeeCodeClaim}
          onValueChange={setEmployeeCodeClaim}
        />
        <Input
          isRequired
          autoComplete="new-password"
          label={t("auth.password")}
          minLength={6}
          radius="sm"
          type="password"
          value={password}
          onValueChange={setPassword}
        />
        {register.isError ? <p aria-live="polite" className="text-sm text-danger">{getErrorMessage(register.error)}</p> : null}
        <Button className="h-10 w-full font-medium" color="primary" isLoading={register.isPending} radius="sm" type="submit">
          {register.isPending ? t("auth.loading") : t("auth.register")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.haveAccount")} {" "}
        <Link className="font-medium text-primary" href="/login">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const verify = useMutation({
    mutationFn: () =>
      fetchApi<AuthResult>("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      }),
    onSuccess: (result) => router.replace(result.next),
  });

  return (
    <AuthShell description={t("auth.verifyDescription")} title={t("auth.verifyTitle")}>
      <p className="mb-5 text-sm text-muted">{t("auth.checkEmail")}</p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          verify.mutate();
        }}
      >
        <Input
          isRequired
          autoComplete="email"
          label={t("auth.email")}
          radius="sm"
          type="email"
          value={email}
          onValueChange={setEmail}
        />
        <Input
          isRequired
          autoComplete="one-time-code"
          inputMode="numeric"
          label={t("auth.otp")}
          maxLength={6}
          radius="sm"
          value={otp}
          onValueChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
        />
        {verify.isError ? <p aria-live="polite" className="text-sm text-danger">{getErrorMessage(verify.error)}</p> : null}
        <Button className="h-10 w-full font-medium" color="primary" isLoading={verify.isPending} radius="sm" type="submit">
          {verify.isPending ? t("auth.loading") : t("auth.verify")}
        </Button>
      </form>
      <AuthBackLink />
    </AuthShell>
  );
}
