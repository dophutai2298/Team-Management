"use client";

import { Chip, Input, Pagination, Select, SelectItem } from "@heroui/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  FilterX,
  Search,
  UserRoundX,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { PendingAccount } from "@/lib/admin/approval";
import { useLocale } from "@/lib/i18n/locale-provider";

import { ActionButton } from "../heroui/action-button";
import { selectFieldClassNames, selectPopoverClassNames } from "../heroui/field-styles";

const DAY = 24 * 60 * 60 * 1000;

const paginationControlClassNames = {
  base: "m-0 overflow-visible p-0",
  wrapper: "gap-1",
  item:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-xs font-semibold text-ink shadow-none data-[active=true]:text-white data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
  cursor: "h-8 min-h-8 w-8 min-w-8 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-button",
  prev:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
  next:
    "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5",
} as const;

type PendingAccountsTableProps = {
  accounts: PendingAccount[];
  onApprove: (account: PendingAccount) => void;
  onReject: (account: PendingAccount) => void;
};

export function PendingAccountsTable({ accounts, onApprove, onReject }: PendingAccountsTableProps) {
  const { locale, t } = useLocale();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "requestedAt", desc: true }]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );
  const columns = useMemo<ColumnDef<PendingAccount>[]>(
    () => [
      {
        accessorFn: (account) => `${account.fullName} ${account.email}`,
        id: "account",
        header: t("admin.account"),
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="text-sm font-semibold text-ink">{row.original.fullName}</p>
            <p className="mt-0.5 text-xs text-muted">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "employeeCodeClaim",
        header: t("admin.claimedCode"),
        cell: ({ getValue }) => (
          <Chip className="h-6 px-2 font-mono text-[11px]" radius="sm" size="sm" variant="flat">
            {String(getValue())}
          </Chip>
        ),
      },
      {
        accessorKey: "requestedAt",
        header: t("admin.requestedAt"),
        filterFn: (row, columnId, value) => {
          const requestedAt = new Date(String(row.getValue(columnId))).getTime();
          return Number.isFinite(requestedAt) && Date.now() - requestedAt <= Number(value);
        },
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-sm text-muted">
            {dateFormatter.format(new Date(String(getValue())))}
          </span>
        ),
      },
      {
        id: "actions",
        enableGlobalFilter: false,
        enableSorting: false,
        header: t("admin.actions"),
        cell: ({ row }) => (
          <div className="flex min-w-[190px] justify-end gap-2">
            <ActionButton
              className="h-8 px-3 text-xs"
              color="danger"
              size="sm"
              startContent={<UserRoundX aria-hidden size={14} />}
              variant="flat"
              onPress={() => onReject(row.original)}
            >
              {t("admin.reject")}
            </ActionButton>
            <ActionButton
              className="h-8 px-3 text-xs"
              color="primary"
              size="sm"
              startContent={<Check aria-hidden size={14} />}
              onPress={() => onApprove(row.original)}
            >
              {t("admin.approve")}
            </ActionButton>
          </div>
        ),
      },
    ],
    [dateFormatter, onApprove, onReject, t],
  );

  // TanStack Table exposes mutable helpers by design; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: accounts,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: { columnFilters, globalFilter, sorting },
  });
  const requestedAtFilter = table.getColumn("requestedAt")?.getFilterValue();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const hasFilters = Boolean(globalFilter || requestedAtFilter);

  return (
    <div>
      <div className="grid gap-3 border-b border-line bg-slate-50/80 px-5 py-4 dark:bg-white/[0.03] md:grid-cols-[minmax(240px,1fr)_190px_auto] md:px-6">
        <Input
          aria-label={t("admin.search")}
          classNames={{
            inputWrapper:
              "h-10 rounded-lg border border-line bg-panel shadow-none outline-none data-[hover=true]:border-primary/45 group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[focus-visible=true]:outline-none dark:group-data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
            input: "text-sm font-medium text-ink placeholder:text-muted",
          }}
          placeholder={t("admin.searchPlaceholder")}
          radius="lg"
          startContent={<Search aria-hidden className="text-muted" size={16} />}
          value={globalFilter}
          variant="bordered"
          onValueChange={setGlobalFilter}
        />
        <Select
          aria-label={t("admin.requestFilter")}
          classNames={{
            ...selectFieldClassNames,
            trigger:
              "h-10 min-h-10 rounded-lg border border-line bg-panel px-3 shadow-none outline-none data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] data-[focus-visible=true]:outline-none dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
          }}
          placeholder={t("admin.allDates")}
          popoverProps={{ classNames: selectPopoverClassNames }}
          radius="lg"
          selectedKeys={[requestedAtFilter ? String(requestedAtFilter) : "all"]}
          size="sm"
          variant="bordered"
          onChange={(event) => {
            const value = event.target.value;
            table.getColumn("requestedAt")?.setFilterValue(value === "all" ? undefined : Number(value));
          }}
        >
          <SelectItem key="all">{t("admin.allDates")}</SelectItem>
          <SelectItem key={String(DAY)}>{t("admin.lastDay")}</SelectItem>
          <SelectItem key={String(7 * DAY)}>{t("admin.lastSevenDays")}</SelectItem>
          <SelectItem key={String(30 * DAY)}>{t("admin.lastThirtyDays")}</SelectItem>
        </Select>
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
        <table className="w-full min-w-[820px] border-collapse" aria-label={t("admin.pendingTitle")}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line bg-slate-50/90 dark:bg-white/[0.04]">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const sortable = header.column.getCanSort();

                  return (
                    <th key={header.id} className="px-3 py-2.5 text-left first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6">
                      {sortable ? (
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
                      ) : (
                        <span className="block text-right text-xs font-semibold text-muted">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
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
                  {t("admin.noFilterResults")}
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
        <div className="flex items-center justify-end gap-3">
          <Select
            aria-label={t("admin.rowsPerPage")}
            classNames={{
            ...selectFieldClassNames,
            trigger:
                "h-9 min-h-9 w-[76px] rounded-lg border border-line !bg-panel px-2 shadow-none outline-none data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] data-[focus-visible=true]:outline-none dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
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
