"use client";

import { Chip } from "@heroui/react";
import { Building2, Mail, Users } from "lucide-react";
import { useMemo } from "react";

import type { OrganizationEmployee } from "@/lib/organization/organization";
import { useLocale } from "@/lib/i18n/locale-provider";

type OrganizationChartProps = {
  employees: OrganizationEmployee[];
};

type ChartNode = OrganizationEmployee & {
  children: ChartNode[];
};

function buildChart(employees: OrganizationEmployee[]): ChartNode[] {
  const nodes = new Map<string, ChartNode>();

  for (const employee of employees) {
    nodes.set(employee.id, { ...employee, children: [] });
  }

  const roots: ChartNode[] = [];

  for (const node of nodes.values()) {
    const manager = node.managerEmployeeId ? nodes.get(node.managerEmployeeId) : null;

    if (manager) {
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: ChartNode[]) => {
    items.sort((a, b) => a.fullName.localeCompare(b.fullName));
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);

  return roots;
}

function ChartBranch({ node, depth }: { node: ChartNode; depth: number }) {
  return (
    <li>
      <div
        className="grid gap-3 border-b border-line/75 px-4 py-3 transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 sm:grid-cols-[minmax(220px,1fr)_minmax(160px,0.7fr)_110px]"
        style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{node.fullName}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
            <Mail aria-hidden size={12} />
            <span className="truncate">{node.email}</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase text-muted">{node.roleName ?? "-"}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
            <Building2 aria-hidden size={12} />
            <span className="truncate">{node.primaryTeamName ?? "-"}</span>
          </p>
        </div>
        <Chip className="h-7 justify-self-start px-2 text-xs font-semibold" radius="sm" size="sm" variant="flat">
          {node.children.length}
        </Chip>
      </div>
      {node.children.length > 0 ? (
        <ol className="border-l border-line/80">
          {node.children.map((child) => (
            <ChartBranch key={child.id} depth={depth + 1} node={child} />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

export function OrganizationChart({ employees }: OrganizationChartProps) {
  const { t } = useLocale();
  const roots = useMemo(() => buildChart(employees), [employees]);

  if (employees.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <Users aria-hidden className="text-muted" size={28} />
        <p className="text-sm font-semibold text-ink">{t("organization.emptyChart")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="grid gap-3 border-b border-line bg-slate-50/80 px-4 py-2.5 text-xs font-semibold uppercase text-muted dark:bg-white/[0.03] sm:grid-cols-[minmax(220px,1fr)_minmax(160px,0.7fr)_110px]">
        <span>{t("organization.person")}</span>
        <span>{t("organization.assignment")}</span>
        <span>{t("organization.reports")}</span>
      </div>
      <ol>
        {roots.map((root) => (
          <ChartBranch key={root.id} depth={0} node={root} />
        ))}
      </ol>
    </div>
  );
}
