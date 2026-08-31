"use client";

import { Skeleton } from "@heroui/react";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { SearchableSelect } from "@/components/heroui/controlled-fields";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  buildTeamOrganizationChart,
  prepareOrganizationChartForRender,
} from "@/lib/organization/organization-hierarchy";
import type { OrganizationEmployee, OrganizationTeam } from "@/lib/organization/organization";

const UnicefOrgChart = dynamic(
  () => import("@unicef/react-org-chart").then((module) => module.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[560px] w-full rounded-none" />,
  },
);

type OrganizationChartProps = {
  employees: OrganizationEmployee[];
  teams: OrganizationTeam[];
  selectedTeamId: string;
  onSelectedTeamChange: (teamId: string) => void;
};

export function OrganizationChart({
  employees,
  teams,
  selectedTeamId,
  onSelectedTeamChange,
}: OrganizationChartProps) {
  const { t } = useLocale();
  const chart = useMemo(
    () => buildTeamOrganizationChart(employees, teams, selectedTeamId),
    [employees, selectedTeamId, teams],
  );
  const renderChart = chart ? prepareOrganizationChartForRender(chart) : null;
  const controlPrefix = `organization-chart-${selectedTeamId}`;

  return (
    <div key={selectedTeamId} className="min-w-0">
      <div className="border-b border-line bg-slate-50/80 px-5 py-4 dark:bg-white/[0.03] md:px-6">
        <div className="w-full sm:max-w-[300px]">
          <SearchableSelect
            ariaLabel={t("organization.chartTeamLabel")}
            compact
            options={teams.map((team) => ({ id: team.id, name: team.name }))}
            placeholder={t("organization.chartTeamLabel")}
            selectedKey={selectedTeamId}
            onSelectionChange={(key) => {
              if (key !== null) onSelectedTeamChange(String(key));
            }}
          />
        </div>
      </div>

      {renderChart ? (
        <div
          className="organization-chart-canvas h-[560px] min-w-0 overflow-hidden bg-panel"
          aria-label={t("organization.chartTitle")}
          role="region"
        >
          <p className="sr-only">{t("organization.chartAccessibility")}</p>
          <UnicefOrgChart
            key={renderChart.id}
            animationDuration={220}
            avatarWidth={0}
            backgroundColor="#ffffff"
            borderColor="#cbd5e1"
            id={controlPrefix}
            lineType="angle"
            nameColor="#172033"
            nodeBorderRadius={6}
            nodeHeight={124}
            nodePaddingX={14}
            nodePaddingY={14}
            nodeSpacing={28}
            nodeWidth={230}
            reportsColor="#64748b"
            shouldResize={false}
            titleColor="#64748b"
            tree={renderChart}
          />
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <Users aria-hidden className="text-muted" size={28} />
          <p className="text-sm font-semibold text-ink">{t("organization.emptyChart")}</p>
          <p className="max-w-md text-xs leading-5 text-muted">{t("organization.emptyChartDescription")}</p>
        </div>
      )}
    </div>
  );
}
