"use client";

import { Chip, Input, Pagination, Progress, Select, SelectItem } from "@heroui/react";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, FilterX, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ActionButton } from "@/components/heroui/action-button";
import { selectFieldClassNames, selectPopoverClassNames } from "@/components/heroui/field-styles";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { TaskPriority, TaskStatus, TaskSummary, TaskType } from "@/lib/task/task";

const paginationClassNames = {
  base: "m-0 overflow-visible p-0",
  wrapper: "gap-1",
  item: "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-xs font-semibold text-ink shadow-none",
  cursor: "h-8 min-h-8 w-8 min-w-8 rounded-lg bg-primary text-white shadow-none",
  prev: "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none",
  next: "h-8 min-h-8 w-8 min-w-8 rounded-lg border border-line bg-panel text-ink shadow-none [&>svg]:rotate-180",
} as const;

type TasksTableProps = {
  tasks: TaskSummary[];
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onView: (taskId: string) => void;
};

const taskTypeMessageKeys: Record<TaskType, MessageKey> = {
  personal: "tasks.personal",
  assigned: "tasks.assigned",
};

const taskStatusMessageKeys: Record<TaskStatus, MessageKey> = {
  todo: "tasks.todo",
  in_progress: "tasks.inProgress",
  blocked: "tasks.blocked",
  done: "tasks.done",
  cancelled: "tasks.cancelled",
};

const taskPriorityMessageKeys: Record<TaskPriority, MessageKey> = {
  low: "tasks.low",
  medium: "tasks.medium",
  high: "tasks.high",
  urgent: "tasks.urgent",
};

function priorityColor(priority: TaskPriority): "default" | "danger" | "primary" | "warning" {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "primary";
  return "default";
}

function statusColor(status: TaskStatus): "default" | "danger" | "primary" | "success" | "warning" {
  if (status === "done") return "success";
  if (status === "blocked") return "danger";
  if (status === "in_progress") return "primary";
  if (status === "cancelled") return "warning";
  return "default";
}

export function TasksTable({ tasks, onDelete, onEdit, onView }: TasksTableProps) {
  const { locale, t } = useLocale();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" }),
    [locale],
  );
  const columns = useMemo<ColumnDef<TaskSummary>[]>(
    () => [
      {
        accessorFn: (task) => `${task.title} ${task.creatorName} ${task.teamName ?? ""} ${task.assigneeNames.join(" ")}`,
        id: "title",
        header: t("tasks.taskTitle"),
        cell: ({ row }) => (
          <div className="min-w-[230px]">
            <p className="line-clamp-1 text-sm font-semibold text-ink">{row.original.title}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{row.original.creatorName}</p>
          </div>
        ),
      },
      {
        accessorKey: "taskType",
        header: t("tasks.type"),
        filterFn: (row, columnId, value) => String(row.getValue(columnId)) === String(value),
        cell: ({ getValue }) => {
          const type = getValue<TaskType>();
          return <Chip className="h-6 px-2 text-xs" radius="sm" size="sm" variant="flat">{t(taskTypeMessageKeys[type])}</Chip>;
        },
      },
      {
        accessorKey: "priority",
        header: t("tasks.priority"),
        cell: ({ getValue }) => {
          const priority = getValue<TaskPriority>();
          return (
            <Chip className="h-6 px-2 text-xs capitalize" color={priorityColor(priority)} radius="sm" size="sm" variant="flat">
              {t(taskPriorityMessageKeys[priority])}
            </Chip>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("tasks.status"),
        cell: ({ getValue }) => {
          const status = getValue<TaskStatus>();
          return (
            <Chip className="h-6 px-2 text-xs" color={statusColor(status)} radius="sm" size="sm" variant="flat">
              {t(taskStatusMessageKeys[status])}
            </Chip>
          );
        },
      },
      {
        accessorKey: "progress",
        header: t("tasks.progress"),
        cell: ({ getValue }) => {
          const progress = getValue<number>();
          return (
            <div className="min-w-[110px]">
              <p className="mb-1 text-xs font-semibold text-muted">{progress}%</p>
              <Progress aria-label={`${progress}%`} classNames={{ track: "h-1.5 bg-line", indicator: "bg-primary" }} value={progress} />
            </div>
          );
        },
      },
      {
        accessorKey: "dueDate",
        header: t("tasks.dueDate"),
        cell: ({ getValue }) => {
          const dueDate = getValue<string | null>();
          return <span className="whitespace-nowrap text-sm text-muted">{dueDate ? dateFormatter.format(new Date(`${dueDate}T00:00:00`)) : t("tasks.noDueDate")}</span>;
        },
      },
      {
        id: "actions",
        enableGlobalFilter: false,
        enableSorting: false,
        header: t("admin.actions"),
        cell: ({ row }) => (
          <div className="flex min-w-[120px] justify-end gap-1">
            <ActionButton isIconOnly aria-label={t("tasks.viewDetails")} size="sm" variant="light" onPress={() => onView(row.original.id)}>
              <Eye aria-hidden size={16} />
            </ActionButton>
            {row.original.canEdit ? (
              <ActionButton isIconOnly aria-label={t("tasks.editTitle")} size="sm" variant="light" onPress={() => onEdit(row.original.id)}>
                <Pencil aria-hidden size={15} />
              </ActionButton>
            ) : null}
            {row.original.canDelete ? (
              <ActionButton isIconOnly aria-label={t("tasks.delete")} color="danger" size="sm" variant="light" onPress={() => onDelete(row.original.id)}>
                <Trash2 aria-hidden size={15} />
              </ActionButton>
            ) : null}
          </div>
        ),
      },
    ],
    [dateFormatter, onDelete, onEdit, onView, t],
  );

  // TanStack Table exposes mutable helpers by design; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: tasks,
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
  const typeFilter = table.getColumn("taskType")?.getFilterValue();
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div>
      <div className="grid gap-3 border-b border-line bg-slate-50/80 px-5 py-4 dark:bg-white/[0.03] md:grid-cols-[minmax(240px,1fr)_180px_auto] md:px-6">
        <Input
          aria-label={t("tasks.search")}
          classNames={{ inputWrapper: "h-10 rounded-lg border border-line bg-panel shadow-none", input: "text-sm font-medium text-ink placeholder:text-muted" }}
          placeholder={t("tasks.searchPlaceholder")}
          startContent={<Search aria-hidden className="text-muted" size={16} />}
          value={globalFilter}
          variant="bordered"
          onValueChange={setGlobalFilter}
        />
        <Select
          aria-label={t("tasks.type")}
          classNames={{ ...selectFieldClassNames, trigger: "h-10 min-h-10 rounded-lg border border-line !bg-panel px-3 shadow-none" }}
          popoverProps={{ classNames: selectPopoverClassNames }}
          selectedKeys={[typeFilter ? String(typeFilter) : "all"]}
          size="sm"
          variant="bordered"
          onChange={(event) => table.getColumn("taskType")?.setFilterValue(event.target.value === "all" ? undefined : event.target.value)}
        >
          <SelectItem key="all">{t("tasks.allTypes")}</SelectItem>
          <SelectItem key="personal">{t("tasks.personal")}</SelectItem>
          <SelectItem key="assigned">{t("tasks.assigned")}</SelectItem>
        </Select>
        <ActionButton
          className="h-10 px-3 text-sm"
          isDisabled={!globalFilter && !typeFilter}
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
        <table aria-label={t("tasks.tableTitle")} className="w-full min-w-[1040px] border-collapse">
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
                          endContent={sorted === "asc" ? <ArrowUp aria-hidden size={13} /> : sorted === "desc" ? <ArrowDown aria-hidden size={13} /> : <ArrowUpDown aria-hidden size={13} />}
                          size="sm"
                          variant="light"
                          onPress={() => header.column.toggleSorting(sorted === "asc")}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </ActionButton>
                      ) : (
                        <span className="block text-right text-xs font-semibold text-muted">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-primary/5">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-4 align-middle first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-sm text-muted" colSpan={columns.length}>{t("tasks.noResults")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-line bg-slate-50/60 px-5 py-4 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{filteredCount} {t("tasks.count")}</p>
        <div className="flex items-center gap-3">
          <Pagination classNames={paginationClassNames} showControls page={table.getState().pagination.pageIndex + 1} size="sm" total={Math.max(table.getPageCount(), 1)} onChange={(page) => table.setPageIndex(page - 1)} />
        </div>
      </div>
    </div>
  );
}
