import { Chip, Divider } from "@heroui/react";

export type WorkspaceStatus = "ready" | "checking" | "error";

export type StatusItem = {
  label: string;
  detail: string;
  status: WorkspaceStatus;
  statusLabel: string;
};

type StatusListProps = {
  items: readonly StatusItem[];
};

const statusColors: Record<WorkspaceStatus, "success" | "warning" | "danger"> = {
  ready: "success",
  checking: "warning",
  error: "danger",
};

export function StatusList({ items }: StatusListProps) {
  return (
    <ul className="mt-1 space-y-1" aria-live="polite">
      {items.map((item, index) => (
        <li key={item.label}>
          {index > 0 ? <Divider className="bg-line" /> : null}
          <div className="flex min-h-16 items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{item.label}</p>
              <p className="truncate text-xs leading-5 text-muted">{item.detail}</p>
            </div>
            <Chip
              className="h-6 shrink-0 border-0 px-2 text-[11px] font-semibold"
              color={statusColors[item.status]}
              radius="full"
              size="sm"
              variant="flat"
            >
              {item.statusLabel}
            </Chip>
          </div>
        </li>
      ))}
    </ul>
  );
}
