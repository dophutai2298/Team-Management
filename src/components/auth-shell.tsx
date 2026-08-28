"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  LayoutDashboard,
  LogOut,
  MailCheck,
  ShieldAlert,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { ActionButton } from "./heroui/action-button";

type AccessStatusProps = {
  kind: "pending" | "blocked";
};

const accessSteps: Array<{ detail: MessageKey; icon: LucideIcon; title: MessageKey }> = [
  { detail: "auth.stepVerifyDetail", icon: MailCheck, title: "auth.stepVerify" },
  { detail: "auth.stepApproveDetail", icon: UserRoundCheck, title: "auth.stepApprove" },
  { detail: "auth.stepWorkspaceDetail", icon: LayoutDashboard, title: "auth.stepWorkspace" },
];

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
    <main className="min-h-[100dvh] bg-canvas px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between border-b border-line pb-4">
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

      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 py-9 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-16 lg:py-10">
        <section className="hidden min-h-[540px] flex-col justify-between border-r border-line pr-14 lg:flex">
          <div>
            <Chip className="h-7 bg-primary/10 px-2.5 text-xs font-semibold text-primary" radius="sm" variant="flat">
              {t("auth.brandNote")}
            </Chip>
            <h2 className="mt-6 max-w-lg text-3xl font-semibold leading-10 text-ink">{t("auth.accessFlow")}</h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-muted">{t("auth.accessFlowDescription")}</p>

            <ol className="mt-10 space-y-2">
              {accessSteps.map(({ detail, icon: Icon, title: stepTitle }, index) => (
                <li key={stepTitle} className="grid grid-cols-[42px_1fr] gap-4 rounded-lg px-2 py-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-panel text-primary shadow-sm">
                    <Icon aria-hidden size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      <span className="mr-2 text-xs text-muted">0{index + 1}</span>
                      {t(stepTitle)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">{t(detail)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center gap-3 border-t border-line pt-5 text-sm text-muted">
            <Building2 aria-hidden size={18} />
            <span>{t("app.name")}</span>
          </div>
        </section>

        <Card className="w-full border border-line border-t-primary bg-panel shadow-panel" radius="lg">
          <CardBody className="gap-0 p-6 sm:p-8">
            <div className="mb-7">
              <span className="mb-5 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary lg:hidden">
                <Building2 aria-hidden size={20} />
              </span>
              <h1 className="text-2xl font-semibold leading-8 text-ink">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </div>
            <div>{children}</div>
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
      <ActionButton
        className="mt-6 h-11 w-full font-semibold"
        color="primary"
        isLoading={signOut.isPending}
        radius="lg"
        startContent={signOut.isPending ? undefined : <LogOut aria-hidden size={16} />}
        onPress={() => signOut.mutate()}
      >
        {signOut.isPending ? t("auth.loading") : t("auth.signOut")}
      </ActionButton>
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
