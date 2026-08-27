"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Building2, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-provider";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

type AccessStatusProps = {
  kind: "pending" | "blocked";
};

export function AuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const { t } = useLocale();

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-5 sm:p-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link className="flex items-center gap-3 text-ink" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            TM
          </span>
          <span>
            <span className="block text-sm font-semibold">{t("app.name")}</span>
            <span className="block text-xs text-muted">{t("auth.brandNote")}</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-7rem)] w-full max-w-5xl place-items-center py-10">
        <Card className="w-full max-w-md border border-line bg-panel shadow-none" radius="sm">
          <CardBody className="gap-0 p-5 sm:p-7">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 aria-hidden size={21} />
            </span>
            <h1 className="text-xl font-semibold text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            <div className="mt-7">{children}</div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

export function AccessStatus({ kind }: AccessStatusProps) {
  const router = useRouter();
  const { t } = useLocale();
  const signOut = useMutation({
    mutationFn: () => fetchApi<{ next: string }>("/api/auth/sign-out", { method: "POST" }),
    onSuccess: (result) => router.replace(result.next),
  });
  const isPending = kind === "pending";

  return (
    <AuthShell
      description={t(isPending ? "auth.pendingDescription" : "auth.blockedDescription")}
      title={t(isPending ? "auth.pendingTitle" : "auth.blockedTitle")}
    >
      <div className="border-y border-line py-5">
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg ${
            isPending
              ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400"
              : "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
          }`}
        >
          {isPending ? <BadgeCheck aria-hidden size={20} /> : <ShieldAlert aria-hidden size={20} />}
        </span>
        <p className="mt-4 text-sm font-medium text-ink">
          {t(isPending ? "auth.pendingName" : "auth.blockedTitle")}
        </p>
        {isPending ? <p className="mt-1 text-sm leading-6 text-muted">{t("auth.pendingDetail")}</p> : null}
      </div>
      <Button
        className="mt-6 h-10 w-full font-medium"
        color="primary"
        isLoading={signOut.isPending}
        radius="sm"
        startContent={signOut.isPending ? undefined : <LogOut aria-hidden size={16} />}
        onPress={() => signOut.mutate()}
      >
        {signOut.isPending ? t("auth.loading") : t("auth.signOut")}
      </Button>
    </AuthShell>
  );
}

export function AuthBackLink() {
  const { t } = useLocale();

  return (
    <Link className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary" href="/login">
      <ArrowLeft aria-hidden size={16} />
      {t("auth.backToSignIn")}
    </Link>
  );
}
