"use client";

import { Chip, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2, RefreshCw, Users } from "lucide-react";

import { OrganizationTable } from "@/components/data-table/organization-table";
import { ActionButton } from "@/components/heroui/action-button";
import { OrganizationChart } from "@/components/organization/organization-chart";
import { EmptyPanel } from "@/components/workspace/empty-panel";
import { MetricGrid } from "@/components/workspace/metric-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { ApiClientError, fetchApi } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { OrganizationView } from "@/lib/organization/organization";

const errorMessageKeys: Partial<Record<string, MessageKey>> = {
  FORBIDDEN: "organization.errorForbidden",
  ORGANIZATION_LOAD_FAILED: "organization.errorGeneric",
  UNAUTHENTICATED: "admin.errorUnauthenticated",
};

function getErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
  return error instanceof ApiClientError
    ? t(errorMessageKeys[error.code] ?? "organization.errorGeneric")
    : t("organization.errorGeneric");
}

function OrganizationSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export function OrganizationWorkspace() {
  const { t } = useLocale();
  const organizationQuery = useQuery({
    queryKey: ["organization"],
    queryFn: () => fetchApi<OrganizationView>("/api/organization"),
  });
  const organization = organizationQuery.data;
  const employeeCount = organization?.employees.length ?? 0;
  const teamCount = organization?.teams.length ?? 0;
  const managerCount =
    organization?.employees.filter((employee) => employee.directReportsCount > 0).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        actions={
          organization ? (
            <Chip className="h-8 px-2.5 text-xs font-semibold" color="primary" radius="sm" variant="flat">
              {t(organization.scope.labelKey)}
            </Chip>
          ) : null
        }
        description={t("organization.description")}
        eyebrow={t("organization.eyebrow")}
        title={t("organization.title")}
      />

      {organizationQuery.isPending ? (
        <section className="mt-7" aria-label={t("organization.loading")}>
          <WorkspacePanel
            description={t("organization.loadingDescription")}
            id="organization-loading-title"
            title={t("organization.tableTitle")}
          >
            <OrganizationSkeleton />
          </WorkspacePanel>
        </section>
      ) : null}

      {organizationQuery.isError ? (
        <section className="mt-7">
          <WorkspacePanel
            action={
              <ActionButton
                color="danger"
                isLoading={organizationQuery.isFetching}
                size="sm"
                startContent={<RefreshCw aria-hidden size={15} />}
                variant="flat"
                onPress={() => void organizationQuery.refetch()}
              >
                {t("admin.retry")}
              </ActionButton>
            }
            description={t("organization.errorDescription")}
            id="organization-error-title"
            title={t("organization.loadError")}
          >
            <EmptyPanel
              action={
                <ActionButton color="primary" size="sm" onPress={() => void organizationQuery.refetch()}>
                  {t("admin.retry")}
                </ActionButton>
              }
              description={getErrorMessage(organizationQuery.error, t)}
              icon={AlertCircle}
              title={t("organization.loadError")}
            />
          </WorkspacePanel>
        </section>
      ) : null}

      {organization ? (
        <>
          <section className="mt-7">
            <MetricGrid
              ariaLabel={t("organization.metrics")}
              metrics={[
                { label: t("organization.metricPeople"), value: String(employeeCount) },
                { label: t("organization.metricTeams"), value: String(teamCount) },
                { label: t("organization.metricManagers"), value: String(managerCount) },
              ]}
            />
          </section>

          <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <WorkspacePanel
              description={t("organization.chartDescription")}
              id="organization-chart-title"
              title={t("organization.chartTitle")}
            >
              {organization.employees.length > 0 ? (
                <div className="-mx-5 -mb-5 md:-mx-6 md:-mb-6">
                  <OrganizationChart employees={organization.employees} />
                </div>
              ) : (
                <EmptyPanel description={t("organization.emptyDescription")} icon={Building2} title={t("organization.emptyTitle")} />
              )}
            </WorkspacePanel>

            <WorkspacePanel
              description={t("organization.tableDescription")}
              id="organization-table-title"
              title={t("organization.tableTitle")}
            >
              {organization.employees.length > 0 ? (
                <div className="-mx-5 -mb-5 md:-mx-6 md:-mb-6">
                  <OrganizationTable employees={organization.employees} teams={organization.teams} />
                </div>
              ) : (
                <EmptyPanel description={t("organization.emptyDescription")} icon={Users} title={t("organization.emptyTitle")} />
              )}
            </WorkspacePanel>
          </section>
        </>
      ) : null}
    </div>
  );
}
