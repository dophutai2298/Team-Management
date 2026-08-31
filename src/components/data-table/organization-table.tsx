"use client";

import { Chip, Input, Pagination, Select, SelectItem } from "@heroui/react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, FilterX, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { selectFieldClassNames, selectPopoverClassNames } from "@/components/heroui/field-styles";
import { ActionButton } from "@/components/heroui/action-button";
import { SearchableSelect } from "@/components/heroui/controlled-fields";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  buildReportingTableRows,
  type OrganizationReportingRow,
} from "@/lib/organization/organization-hierarchy";
import type { OrganizationEmployee, OrganizationTeam } from "@/lib/organization/organization";

type OrganizationTableProps = {
  employees: OrganizationEmployee[];
  teams: OrganizationTeam[];
  onOpenTeamChart: (teamId: string) => void;
};

const paginationControlClassNames = {
  base: "m-0 overflow-visible p-0",
  wrapper: "gap-1",
  item:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-xs font-semibold text-ink shadow-none data-[active=true]:text-white data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
  cursor: "h-8 min-h-8 w-8 min-w-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-button",
  prev:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
  next:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none [&>svg]:rotate-180 data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
} as const;

export function OrganizationTable({ employees, teams, onOpenTeamChart }: OrganizationTableProps) {
  const { t } = useLocale();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "fullName", desc: false }]);
  const reportingRows = useMemo(() => buildReportingTableRows(employees), [employees]);
  const teamFilterOptions = useMemo(
    () => [{ id: "all", name: t("organization.allTeams") }, ...teams.map((team) => ({ id: team.id, name: team.name }))],
    [teams, t],
  );
  const columns = useMemo<ColumnDef<OrganizationReportingRow>[]>(
    () => [
      {
        accessorFn: (employee) =>
          `${employee.fullName} ${employee.email} ${employee.employeeCode ?? ""} ${employee.positionTitle ?? ""}`,
        id: "fullName",
        header: t("organization.person"),
        cell: ({ row }) => (
          <div
            className="flex min-w-[260px] items-center gap-2"
            style={{ paddingLeft: `${row.depth * 1.25}rem` }}
          >
            {row.getCanExpand() ? (
              <ActionButton
                aria-label={
                  row.getIsExpanded()
                    ? t("organization.collapseReports")
                    : t("organization.expandReports")
                }
                className="h-7 min-h-7 w-7 min-w-7 shrink-0 border border-line bg-panel p-0 text-muted"
                isIconOnly
                radius="md"
                size="sm"
                variant="bordered"
                onPress={() => row.toggleExpanded()}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown aria-hidden size={14} />
                ) : (
                  <ChevronRight aria-hidden size={14} />
                )}
              </ActionButton>
            ) : (
              <span className="block h-7 w-7 shrink-0" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{row.original.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "employeeCode",
        header: t("admin.officialCode"),
        cell: ({ getValue }) => (
          <Chip className="h-6 px-2 font-mono text-[11px]" radius="sm" size="sm" variant="flat">
            {String(getValue() ?? "-")}
          </Chip>
        ),
      },
      {
        accessorKey: "primaryTeamName",
        header: t("admin.team"),
        filterFn: (row, _columnId, value) => row.original.teamIds.includes(String(value)),
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            {row.original.primaryTeamId && row.original.primaryTeamName ? (
              <ActionButton
                className="h-auto min-w-0 justify-start px-0 py-0 text-sm font-semibold text-primary"
                size="sm"
                variant="light"
                onPress={() => onOpenTeamChart(row.original.primaryTeamId as string)}
              >
                <span className="max-w-[170px] truncate">{row.original.primaryTeamName}</span>
              </ActionButton>
            ) : (
              <p className="truncate text-sm font-medium text-ink">-</p>
            )}
            {row.original.teamNames.length > 1 ? (
              <p className="mt-0.5 truncate text-xs text-muted">
                {row.original.teamNames.length} {t("organization.memberships")}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "roleName",
        header: t("admin.role"),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-sm text-ink">{String(getValue() ?? "-")}</span>,
      },
      {
        accessorKey: "managerName",
        header: t("admin.manager"),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-sm text-muted">{String(getValue() ?? "-")}</span>,
      },
      {
        accessorKey: "directReportsCount",
        header: t("organization.directReports"),
        cell: ({ getValue }) => <span className="text-sm font-semibold text-ink">{String(getValue())}</span>,
      },
    ],
    [onOpenTeamChart, t],
  );
  // TanStack Table exposes mutable helpers by design; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: reportingRows,
    autoResetExpanded: false,
    filterFromLeafRows: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    paginateExpandedRows: false,
    state: { columnFilters, expanded, globalFilter, sorting },
  });
  const teamFilter = table.getColumn("primaryTeamName")?.getFilterValue();
  const filteredCount = table.getFilteredRowModel().flatRows.length;
  const hasFilters = Boolean(globalFilter || teamFilter);

  return (
    <div>
      <div className="grid gap-3 border-b border-line bg-slate-50/80 px-5 py-4 dark:bg-white/[0.03] md:grid-cols-[minmax(260px,1fr)_220px_auto] md:px-6">
        <Input
          aria-label={t("organization.search")}
          classNames={{
            inputWrapper:
              "h-10 rounded-lg border border-line bg-panel shadow-none outline-none data-[hover=true]:border-primary/45 group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[focus-visible=true]:outline-none dark:group-data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
            input: "text-sm font-medium text-ink placeholder:text-muted",
          }}
          placeholder={t("organization.searchPlaceholder")}
          radius="lg"
          startContent={<Search aria-hidden className="text-muted" size={16} />}
          value={globalFilter}
          variant="bordered"
          onValueChange={setGlobalFilter}
        />
        <SearchableSelect
          ariaLabel={t("organization.teamFilter")}
          compact
          placeholder={t("organization.allTeams")}
          options={teamFilterOptions}
          selectedKey={teamFilter ? String(teamFilter) : "all"}
          onSelectionChange={(key) => {
            const value = String(key ?? "all");
            table.getColumn("primaryTeamName")?.setFilterValue(value === "all" ? undefined : value);
          }}
        />
        <ActionButton
          className="h-10 px-3 text-sm"
          isDisabled={!hasFilters}
          startContent={<FilterX aria-hidden size={16} />}
          variant="flat"
          onPress={() => {
            setGlobalFilter("");
            table.resetColumnFilters();
          }}
        >
          {t("admin.clearFilters")}
        </ActionButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse" aria-label={t("organization.tableTitle")}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line bg-slate-50/90 dark:bg-white/[0.04]">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();

                  return (
                    <th key={header.id} className="px-3 py-2.5 text-left first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6">
                      <ActionButton
                        className="h-8 min-w-0 justify-start gap-1.5 px-1 text-xs text-muted"
                        endContent={
                          sorted === "asc" ? (
                            <ArrowUp aria-hidden size={13} />
                          ) : sorted === "desc" ? (
                            <ArrowDown aria-hidden size={13} />
                          ) : (
                            <ArrowUpDown aria-hidden size={13} />
                          )
                        }
                        size="sm"
                        variant="light"
                        onPress={() => header.column.toggleSorting(sorted === "asc")}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </ActionButton>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-4 align-middle first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-muted" colSpan={columns.length}>
                  {t("organization.noResults")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-line bg-slate-50/60 px-5 py-4 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {filteredCount} {t("admin.results")}
        </p>
        <div className="flex items-center gap-3">
          <Select
            aria-label={t("admin.rowsPerPage")}
            classNames={{
              ...selectFieldClassNames,
              trigger:
                "relative h-9 min-h-9 w-[76px] rounded-lg border border-line !bg-panel px-2 pr-8 shadow-none outline-none data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] data-[focus-visible=true]:outline-none dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
            }}
            popoverProps={{ classNames: selectPopoverClassNames }}
            selectedKeys={[String(table.getState().pagination.pageSize)]}
            size="sm"
            variant="bordered"
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((pageSize) => (
              <SelectItem key={String(pageSize)}>{String(pageSize)}</SelectItem>
            ))}
          </Select>
          <Pagination
            classNames={paginationControlClassNames}
            showControls
            page={table.getState().pagination.pageIndex + 1}
            size="sm"
            total={Math.max(table.getPageCount(), 1)}
            onChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      </div>
    </div>
  );
}
