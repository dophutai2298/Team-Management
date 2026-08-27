"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

import { DashboardOverviewSkeleton } from "./dashboard-overview";

export function WorkspaceLoading() {
  const { t } = useLocale();

  return (
    <div aria-busy="true" aria-label={t("loading.label")}>
      <DashboardOverviewSkeleton />
    </div>
  );
}
