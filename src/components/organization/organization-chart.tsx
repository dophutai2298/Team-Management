"use client";

import { Select, SelectItem, Skeleton } from "@heroui/react";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { selectFieldClassNames, selectPopoverClassNames } from "@/components/heroui/field-styles";
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
        <Select
          aria-label={t("organization.chartTeamLabel")}
          className="w-full sm:max-w-[300px]"
          classNames={{
            ...selectFieldClassNames,
            trigger:
              "relative h-10 min-h-10 rounded-lg border border-line !bg-panel px-3 pr-10 shadow-none outline-none data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] data-[focus-visible=true]:outline-none dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
          }}
          popoverProps={{ classNames: selectPopoverClassNames }}
          selectedKeys={[selectedTeamId]}
          size="sm"
          variant="bordered"
          onChange={(event) => onSelectedTeamChange(event.target.value)}
        >
          {teams.map((team) => (
            <SelectItem key={team.id} textValue={team.name}>
              {team.name}
            </SelectItem>
          ))}
        </Select>
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
