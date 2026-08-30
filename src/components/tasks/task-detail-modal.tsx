"use client";

import { Chip, Divider, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton } from "@heroui/react";
import { AlertCircle, CalendarDays, Pencil, Trash2, UserRound } from "lucide-react";

import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import { EmptyPanel } from "@/components/workspace/empty-panel";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { TaskDetail, TaskPriority, TaskStatus } from "@/lib/task/task";

type TaskDetailModalProps = {
  error?: string;
  isLoading: boolean;
  isOpen: boolean;
  task: TaskDetail | null;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

function statusKey(status: TaskStatus): MessageKey {
  const keys: Record<TaskStatus, MessageKey> = {
    todo: "tasks.todo",
    in_progress: "tasks.inProgress",
    blocked: "tasks.blocked",
    done: "tasks.done",
    cancelled: "tasks.cancelled",
  };
  return keys[status];
}

function priorityKey(priority: TaskPriority): MessageKey {
  const keys: Record<TaskPriority, MessageKey> = {
    low: "tasks.low",
    medium: "tasks.medium",
    high: "tasks.high",
    urgent: "tasks.urgent",
  };
  return keys[priority];
}

export function TaskDetailModal({ error, isLoading, isOpen, task, onClose, onDelete, onEdit }: TaskDetailModalProps) {
  const { locale, t } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });

  return (
    <AppModal isOpen={isOpen} size="2xl" onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader className="flex items-start gap-3 border-b border-line px-5 py-4 pr-16">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary"><CalendarDays aria-hidden size={18} /></span>
          <span className="min-w-0"><span className="block text-base font-bold leading-6 text-ink">{t("tasks.detailTitle")}</span><span className="block text-xs font-normal leading-5 text-muted">{task?.title ?? ""}</span></span>
        </ModalHeader>
        <ModalBody className="max-h-[calc(92dvh-9rem)] overflow-y-auto bg-slate-50/70 px-5 py-5 dark:bg-white/[0.03]">
          {isLoading ? <div className="space-y-4"><Skeleton className="h-7 w-3/4 rounded-lg" /><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-16 w-full rounded-lg" /></div> : null}
          {error ? <EmptyPanel description={error} icon={AlertCircle} title={t("tasks.loadError")} /> : null}
          {task && !isLoading && !error ? (
            <div className="space-y-5">
              <div><h2 className="text-lg font-bold leading-7 text-ink">{task.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{task.description || t("tasks.placeholderAssignee")}</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs font-semibold text-muted">{t("tasks.type")}</p><p className="mt-1 text-sm font-semibold text-ink">{t(task.taskType === "personal" ? "tasks.personal" : "tasks.assigned")}</p></div>
                <div><p className="text-xs font-semibold text-muted">{t("tasks.priority")}</p><p className="mt-1 text-sm font-semibold text-ink">{t(priorityKey(task.priority))}</p></div>
                <div><p className="text-xs font-semibold text-muted">{t("tasks.status")}</p><p className="mt-1 text-sm font-semibold text-ink">{t(statusKey(task.status))}</p></div>
                <div><p className="text-xs font-semibold text-muted">{t("tasks.dueDate")}</p><p className="mt-1 text-sm font-semibold text-ink">{task.dueDate ? dateFormatter.format(new Date(`${task.dueDate}T00:00:00`)) : t("tasks.noDueDate")}</p></div>
              </div>
              <Divider className="bg-line" />
              <section><p className="text-sm font-bold text-ink">{t("tasks.assigneeSummary")}</p>{task.assignees.length === 0 ? <p className="mt-2 text-sm leading-6 text-muted">{t("tasks.placeholderAssignee")}</p> : <div className="mt-3 space-y-2">{task.assignees.map((assignee) => <div key={assignee.employeeId} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2.5"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink"><UserRound aria-hidden className="shrink-0 text-muted" size={15} /><span className="truncate">{assignee.fullName}</span></span><Chip className="h-6 shrink-0 px-2 text-xs" radius="sm" size="sm" variant="flat">{assignee.progress}%</Chip></div>)}</div>}</section>
            </div>
          ) : null}
        </ModalBody>
        {task ? <ModalFooter className="border-t border-line bg-panel px-5 py-4"><ActionButton variant="light" onPress={onClose}>{t("admin.cancel")}</ActionButton>{task.canDelete ? <ActionButton color="danger" startContent={<Trash2 aria-hidden size={16} />} variant="flat" onPress={onDelete}>{t("tasks.delete")}</ActionButton> : null}{task.canEdit ? <ActionButton color="primary" startContent={<Pencil aria-hidden size={16} />} onPress={onEdit}>{t("tasks.editTitle")}</ActionButton> : null}</ModalFooter> : null}
      </ModalContent>
    </AppModal>
  );
}
