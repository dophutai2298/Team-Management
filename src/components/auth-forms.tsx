"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import { getSafeInternalPath } from "@/lib/auth/access";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { AuthBackLink, AuthShell } from "./auth-shell";
import { ActionButton } from "./heroui/action-button";
import { showSuccessToast } from "./heroui/app-toast";
import { ControlledTextField } from "./heroui/controlled-fields";
import { FormError } from "./heroui/form-error";

type AuthResult = { next: string; access?: string; email?: string };
type Translate = (key: MessageKey) => string;

function createSignInSchema(t: Translate) {
  return z.object({
    email: z.string().trim().min(1, t("validation.required")).email(t("validation.invalidEmail")),
    password: z.string().min(1, t("validation.required")),
  });
}

function createRegistrationSchema(t: Translate) {
  return z.object({
    fullName: z.string().trim().min(1, t("validation.required")),
    email: z.string().trim().min(1, t("validation.required")).email(t("validation.invalidEmail")),
    employeeCodeClaim: z.string().trim().min(1, t("validation.required")),
    password: z.string().min(6, t("validation.passwordLength")),
  });
}

function createVerificationSchema(t: Translate) {
  return z.object({
    email: z.string().trim().min(1, t("validation.required")).email(t("validation.invalidEmail")),
    otp: z.string().regex(/^\d{6}$/, t("validation.otpLength")),
  });
}

type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;
type RegistrationValues = z.infer<ReturnType<typeof createRegistrationSchema>>;
type VerificationValues = z.infer<ReturnType<typeof createVerificationSchema>>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const schema = useMemo(() => createSignInSchema(t), [t]);
  const { control, handleSubmit } = useForm<SignInValues>({
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
    resolver: zodResolver(schema),
  });
  const signIn = useMutation({
    mutationFn: (values: SignInValues) =>
      fetchApi<AuthResult>("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, returnTo: getSafeInternalPath(searchParams.get("returnTo")) }),
    }),
    onSuccess: (result) => {
      showSuccessToast(t("auth.toastSignedIn"));
      queryClient.clear();
      router.replace(result.next);
      router.refresh();
    },
  });

  return (
    <AuthShell description={t("auth.signInDescription")} title={t("auth.signInTitle")}>
      <form className="space-y-5" noValidate onSubmit={handleSubmit((values) => signIn.mutate(values))}>
        <ControlledTextField isRequired autoComplete="email" control={control} label={t("auth.email")} name="email" type="email" />
        <ControlledTextField isRequired autoComplete="current-password" control={control} label={t("auth.password")} name="password" type="password" />
        {signIn.isError ? <FormError>{getErrorMessage(signIn.error)}</FormError> : null}
        <ActionButton className="h-11 w-full" color="primary" isLoading={signIn.isPending} type="submit">
          {signIn.isPending ? t("auth.loading") : t("auth.signIn")}
        </ActionButton>
      </form>
      <p className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">
        {t("auth.needAccount")} {" "}
        <Link className="font-semibold text-primary hover:underline" href="/register">{t("auth.createAccount")}</Link>
      </p>
    </AuthShell>
  );
}

export function RegistrationForm() {
  const router = useRouter();
  const { t } = useLocale();
  const schema = useMemo(() => createRegistrationSchema(t), [t]);
  const { control, handleSubmit } = useForm<RegistrationValues>({
    defaultValues: { email: "", employeeCodeClaim: "", fullName: "", password: "" },
    resolver: zodResolver(schema),
  });
  const register = useMutation({
    mutationFn: (values: RegistrationValues) =>
      fetchApi<AuthResult>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: (result, values) => {
      showSuccessToast(t("auth.toastRegistered"));
      router.push(`${result.next}?email=${encodeURIComponent(result.email ?? values.email)}`);
    },
  });

  return (
    <AuthShell description={t("auth.registerDescription")} title={t("auth.registerTitle")}>
      <form className="space-y-5" noValidate onSubmit={handleSubmit((values) => register.mutate(values))}>
        <ControlledTextField isRequired control={control} label={t("auth.fullName")} name="fullName" />
        <ControlledTextField isRequired autoComplete="email" control={control} label={t("auth.email")} name="email" type="email" />
        <ControlledTextField isRequired control={control} label={t("auth.employeeCode")} name="employeeCodeClaim" />
        <ControlledTextField isRequired autoComplete="new-password" control={control} label={t("auth.password")} name="password" type="password" />
        {register.isError ? <FormError>{getErrorMessage(register.error)}</FormError> : null}
        <ActionButton className="h-11 w-full" color="primary" isLoading={register.isPending} type="submit">
          {register.isPending ? t("auth.loading") : t("auth.register")}
        </ActionButton>
      </form>
      <p className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">
        {t("auth.haveAccount")} {" "}
        <Link className="font-semibold text-primary hover:underline" href="/login">{t("auth.signIn")}</Link>
      </p>
    </AuthShell>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const schema = useMemo(() => createVerificationSchema(t), [t]);
  const { control, handleSubmit } = useForm<VerificationValues>({
    defaultValues: { email: searchParams.get("email") ?? "", otp: "" },
    resolver: zodResolver(schema),
  });
  const verify = useMutation({
    mutationFn: (values: VerificationValues) =>
      fetchApi<AuthResult>("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: (result) => {
      showSuccessToast(t("auth.toastVerified"));
      router.replace(result.next);
    },
  });

  return (
    <AuthShell description={t("auth.verifyDescription")} title={t("auth.verifyTitle")}>
      <p className="mb-6 rounded-lg border border-primary/10 bg-primary/5 px-3.5 py-3 text-sm font-medium leading-6 text-muted">{t("auth.checkEmail")}</p>
      <form className="space-y-5" noValidate onSubmit={handleSubmit((values) => verify.mutate(values))}>
        <ControlledTextField isRequired autoComplete="email" control={control} label={t("auth.email")} name="email" type="email" />
        <ControlledTextField
          isRequired
          autoComplete="one-time-code"
          control={control}
          inputMode="numeric"
          label={t("auth.otp")}
          maxLength={6}
          name="otp"
          transform={(value) => value.replace(/\D/g, "").slice(0, 6)}
        />
        {verify.isError ? <FormError>{getErrorMessage(verify.error)}</FormError> : null}
        <ActionButton className="h-11 w-full" color="primary" isLoading={verify.isPending} type="submit">
          {verify.isPending ? t("auth.loading") : t("auth.verify")}
        </ActionButton>
      </form>
      <AuthBackLink />
    </AuthShell>
  );
}
