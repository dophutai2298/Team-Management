"use client";

import { Button, Card, CardBody, Chip, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import { fetchApi } from "@/lib/api/client";
import type { HealthStatus } from "@/lib/api/health";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

const metrics = [
  { label: "dashboard.activePeople", value: "--", icon: Users },
  { label: "dashboard.openTasks", value: "--", icon: ClipboardCheck },
  { label: "dashboard.dueThisWeek", value: "--", icon: Clock3 },
  { label: "dashboard.completionRate", value: "--", icon: Activity },
] as const;

function HealthPanel() {
  const { t } = useLocale();
  const healthQuery = useQuery({
    queryKey: ["system", "health"],
    queryFn: () => fetchApi<HealthStatus>("/api/health"),
  });

  return (
    <section aria-labelledby="workspace-health-title" className="border-t border-line pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="workspace-health-title" className="text-sm font-semibold text-ink">
            {t("dashboard.healthTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.healthDescription")}</p>
        </div>
        <Activity aria-hidden className="shrink-0 text-muted" size={19} />
      </div>

      {healthQuery.isPending ? (
        <div aria-live="polite" className="mt-5 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40 rounded-sm" />
            <Skeleton className="h-2.5 w-28 rounded-sm" />
          </div>
          <span className="sr-only">{t("dashboard.healthChecking")}</span>
        </div>
      ) : null}

      {healthQuery.isError ? (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3 dark:border-danger-900/60 dark:bg-danger-950/25 sm:flex-row sm:items-center">
          <CircleAlert aria-hidden className="shrink-0 text-danger" size={18} />
          <p className="min-w-0 flex-1 text-sm text-danger-700 dark:text-danger-300">
            {t("dashboard.healthError")}
          </p>
          <Button
            className="self-start sm:self-auto"
            color="danger"
            radius="sm"
            size="sm"
            startContent={<RefreshCw aria-hidden size={14} />}
            variant="flat"
            onPress={() => void healthQuery.refetch()}
          >
            {t("dashboard.retry")}
          </Button>
        </div>
      ) : null}

      {healthQuery.isSuccess ? (
        <div className="mt-5 flex items-center gap-3" aria-live="polite">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
            <CheckCircle2 aria-hidden size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{t("dashboard.healthReady")}</p>
            <p className="truncate text-xs text-muted">{healthQuery.data.service}</p>
          </div>
          <Chip color="success" radius="sm" size="sm" variant="flat">
            API
          </Chip>
        </div>
      ) : null}
    </section>
  );
}

export function DashboardOverview() {
  const { t } = useLocale();

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">{t("dashboard.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink md:text-3xl">
            {t("dashboard.greeting")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted md:text-base">
            {t("dashboard.description")}
          </p>
        </div>
        <Button
          className="h-10 self-start font-medium sm:self-auto"
          color="primary"
          radius="sm"
          startContent={<Plus aria-hidden size={17} />}
        >
          {t("dashboard.quickAction")}
        </Button>
      </div>

      <section aria-label={t("dashboard.title")} className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="min-w-0 border border-line bg-panel shadow-none" radius="sm">
            <CardBody className="min-w-0 gap-4 p-4 md:p-5">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <span className="min-w-0 text-xs font-medium leading-5 text-muted md:text-sm">
                  {t(label as MessageKey)}
                </span>
                <Icon aria-hidden className="shrink-0 text-muted" size={17} strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <section aria-labelledby="priority-title" className="min-h-72 rounded-lg border border-line bg-panel p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="priority-title" className="text-base font-semibold text-ink">
              {t("dashboard.priorityTitle")}
            </h2>
            <Button isIconOnly aria-label={t("dashboard.priorityTitle")} radius="sm" size="sm" variant="light">
              <ArrowUpRight aria-hidden size={17} />
            </Button>
          </div>
          <div className="grid min-h-52 place-items-center py-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                <CheckCircle2 aria-hidden size={21} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{t("dashboard.priorityEmpty")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("dashboard.priorityEmptyDescription")}
              </p>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-panel p-5 md:p-6">
          <div className="grid min-h-44 place-items-center border-b border-line pb-5 text-center">
            <div className="max-w-xs">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <LayoutReadyIcon />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-ink">{t("dashboard.emptyTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{t("dashboard.emptyDescription")}</p>
            </div>
          </div>
          <HealthPanel />
        </aside>
      </div>
    </div>
  );
}

function LayoutReadyIcon() {
  return <ClipboardCheck aria-hidden size={21} />;
}
