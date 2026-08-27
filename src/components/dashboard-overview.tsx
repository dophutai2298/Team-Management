"use client";

import { Button, ButtonGroup, Chip, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, RefreshCw } from "lucide-react";

import { fetchApi } from "@/lib/api/client";
import type { HealthStatus } from "@/lib/api/health";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { EmptyPanel } from "./workspace/empty-panel";
import { MetricGrid } from "./workspace/metric-grid";
import { PageHeader } from "./workspace/page-header";
import { StatusList, type StatusItem } from "./workspace/status-list";
import { WorkspacePanel } from "./workspace/workspace-panel";

const metricLabels = [
  "dashboard.activePeople",
  "dashboard.openTasks",
  "dashboard.dueThisWeek",
  "dashboard.completionRate",
] as const;

function WorkspaceStatus() {
  const { t } = useLocale();
  const healthQuery = useQuery({
    queryKey: ["system", "health"],
    queryFn: () => fetchApi<HealthStatus>("/api/health"),
  });

  const items: StatusItem[] = healthQuery.isPending
    ? [
        { label: t("dashboard.statusApi"), detail: t("dashboard.healthChecking"), status: "checking", statusLabel: t("dashboard.statusChecking") },
        { label: t("dashboard.statusAuth"), detail: t("dashboard.statusSessionActive"), status: "ready", statusLabel: t("dashboard.statusOperational") },
        { label: t("dashboard.statusDatabase"), detail: t("dashboard.statusCheckingBackend"), status: "checking", statusLabel: t("dashboard.statusChecking") },
      ]
    : healthQuery.isError
      ? [
          { label: t("dashboard.statusApi"), detail: t("dashboard.healthError"), status: "error", statusLabel: t("dashboard.statusUnavailableLabel") },
          { label: t("dashboard.statusAuth"), detail: t("dashboard.statusSessionActive"), status: "ready", statusLabel: t("dashboard.statusOperational") },
          { label: t("dashboard.statusDatabase"), detail: t("dashboard.statusUnavailable"), status: "error", statusLabel: t("dashboard.statusUnavailableLabel") },
        ]
      : [
          { label: t("dashboard.statusApi"), detail: t("dashboard.healthReady"), status: "ready", statusLabel: t("dashboard.statusOperational") },
          { label: t("dashboard.statusAuth"), detail: t("dashboard.statusSessionActive"), status: "ready", statusLabel: t("dashboard.statusOperational") },
          {
            label: t("dashboard.statusDatabase"),
            detail: `${t("dashboard.statusBackendReachable")} ${healthQuery.data.backend.latencyMs}ms`,
            status: "ready",
            statusLabel: t("dashboard.statusOperational"),
          },
        ];

  return (
    <aside aria-labelledby="workspace-status-title">
      <WorkspacePanel
        action={
          healthQuery.isError ? (
            <Button
              color="danger"
              radius="sm"
              size="sm"
              startContent={<RefreshCw aria-hidden size={14} />}
              variant="flat"
              onPress={() => void healthQuery.refetch()}
            >
              {t("dashboard.retry")}
            </Button>
          ) : null
        }
        id="workspace-status-title"
        title={t("dashboard.healthTitle")}
      >
        <StatusList items={items} />
        <Button className="mt-3 px-0" color="primary" radius="sm" size="sm" variant="light">
          {t("dashboard.systemDetails")}
        </Button>
      </WorkspacePanel>
    </aside>
  );
}

export function DashboardOverview() {
  const { t } = useLocale();
  const metrics = metricLabels.map((label) => ({ label: t(label as MessageKey), value: "--" }));

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.greeting")}
        description={t("dashboard.description")}
        actions={
          <ButtonGroup radius="sm" size="sm">
            <Button className="h-9 px-3" variant="flat">
              {t("dashboard.today")}
            </Button>
            <Button
              className="h-9 px-3 font-medium"
              color="primary"
              startContent={<Plus aria-hidden size={16} />}
            >
              {t("dashboard.quickAction")}
            </Button>
          </ButtonGroup>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-5 text-sm">
        <Chip
          className="h-6 border-0 px-2 text-[11px] font-medium"
          color="success"
          radius="sm"
          size="sm"
          startContent={<CheckCircle2 aria-hidden size={13} />}
          variant="flat"
        >
          {t("dashboard.onTrackTitle")}
        </Chip>
        <p className="text-muted">{t("dashboard.onTrackDescription")}</p>
      </div>

      <div className="mt-6">
        <MetricGrid ariaLabel={t("dashboard.title")} metrics={metrics} />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.72fr)]">
        <section aria-labelledby="priority-title">
          <WorkspacePanel id="priority-title" title={t("dashboard.priorityTitle")}>
            <EmptyPanel
              action={
                <Button
                  color="primary"
                  radius="sm"
                  size="sm"
                  startContent={<Plus aria-hidden size={15} />}
                >
                  {t("dashboard.priorityAction")}
                </Button>
              }
              description={t("dashboard.priorityEmptyDescription")}
              icon={CheckCircle2}
              title={t("dashboard.priorityEmpty")}
            />
          </WorkspacePanel>
        </section>
        <WorkspaceStatus />
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px]" aria-busy="true">
      <div className="border-b border-line pb-6">
        <Skeleton className="h-3 w-32 rounded-sm" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full rounded-sm" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-sm" />
      </div>
      <Skeleton className="mt-6 h-12 rounded-none" />
      <div className="mt-6 grid grid-cols-2 border border-line md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="border-b border-line p-4 odd:border-r odd:border-line last:border-b-0 md:border-b-0 md:[&:not(:last-child)]:border-r">
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="mt-3 h-6 w-14 rounded-sm" />
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.72fr)]">
        <Skeleton className="h-80 rounded-none" />
        <Skeleton className="h-80 rounded-none" />
      </div>
    </div>
  );
}
