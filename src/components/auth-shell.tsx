"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
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
    <main className="min-h-[100dvh] bg-canvas px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between">
        <Link className="flex items-center gap-3 text-ink" href="/">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            TM
          </span>
          <span>
            <span className="block text-sm font-semibold leading-5">{t("app.name")}</span>
            <span className="block text-xs leading-4 text-muted">{t("auth.brandNote")}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 py-10 lg:min-h-[calc(100dvh-5.5rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(400px,0.72fr)] lg:gap-16 lg:py-8">
        <section className="hidden self-stretch border-l-2 border-primary pl-7 lg:flex lg:items-start lg:justify-center">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 aria-hidden size={24} />
            </span>
            <p className="mt-8 text-sm font-medium text-primary">{t("auth.brandNote")}</p>
            <h1 className="mt-3 max-w-md text-3xl font-semibold leading-10 text-ink">{title}</h1>
            <p className="mt-3 max-w-md text-base leading-7 text-muted">{description}</p>
          </div>
        </section>

        <Card className="w-full border border-line bg-panel shadow-panel" radius="lg">
          <CardHeader className="flex items-center border-b border-line px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 aria-hidden size={19} />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-5 text-ink">{t("app.name")}</span>
                <span className="block text-xs leading-4 text-muted">{t("auth.brandNote")}</span>
              </span>
            </div>
          </CardHeader>
          <CardBody className="gap-0 p-5 sm:p-7">
            <div className="lg:hidden">
              <h1 className="text-2xl font-semibold leading-8 text-ink">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </div>
            <div className="mt-0 lg:mt-1">{children}</div>
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
      <div className="rounded-lg border border-line bg-canvas p-5">
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg ${
            isPending
              ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400"
              : "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
          }`}
        >
          {isPending ? <BadgeCheck aria-hidden size={20} /> : <ShieldAlert aria-hidden size={20} />}
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">
          {t(isPending ? "auth.pendingName" : "auth.blockedTitle")}
        </p>
        {isPending ? <p className="mt-1 text-sm leading-6 text-muted">{t("auth.pendingDetail")}</p> : null}
      </div>
      <Button
        className="mt-6 h-11 w-full font-semibold"
        color="primary"
        isLoading={signOut.isPending}
        radius="lg"
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
    <Link className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-primary" href="/login">
      <ArrowLeft aria-hidden size={16} />
      {t("auth.backToSignIn")}
    </Link>
  );
}
