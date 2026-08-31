"use client";

import { Chip, Divider, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton, Textarea } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertCircle, CalendarDays, Download, Gauge, MessageSquare, Paperclip, Pencil, Send, Trash2, Upload, UserRound } from "lucide-react";
import { useRef, useState } from "react";

import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import { textareaFieldClassNames } from "@/components/heroui/field-styles";
import { FormError } from "@/components/heroui/form-error";
import { EmptyPanel } from "@/components/workspace/empty-panel";
import { ApiClientError, fetchApi } from "@/lib/api/client";
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
  onTaskChange?: (task: TaskDetail) => void;
  onUpdateProgress: () => void;
};

type TaskDetailPayload = { task: TaskDetail };

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatError(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function TaskDetailModal({
  error,
  isLoading,
  isOpen,
  task,
  onClose,
  onDelete,
  onEdit,
  onTaskChange,
  onUpdateProgress,
}: TaskDetailModalProps) {
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentBody, setCommentBody] = useState("");
  const dateFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const syncTask = async (data: TaskDetailPayload) => {
    queryClient.setQueryData(["tasks", data.task.id], data);
    onTaskChange?.(data.task);
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };
  const commentMutation = useMutation({
    mutationFn: ({ body, taskId }: { body: string; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: async (data) => {
      setCommentBody("");
      await syncTask(data);
    },
  });
  const uploadMutation = useMutation({
    mutationFn: ({ formData, taskId }: { formData: FormData; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}/attachments`, { method: "POST", body: formData }),
    onSuccess: syncTask,
  });
  const removeMutation = useMutation({
    mutationFn: ({ attachmentId, taskId }: { attachmentId: string; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: syncTask,
  });
  const mutationError = commentMutation.error ?? uploadMutation.error ?? removeMutation.error;

  const postComment = () => {
    if (!task) return;
    const body = commentBody.trim();
    if (!body) return;
    commentMutation.mutate({ body, taskId: task.id });
  };

  const uploadAttachment = (file: File | undefined) => {
    if (!file || !task) return;
    const formData = new FormData();
    formData.append("file", file);
    uploadMutation.mutate({ formData, taskId: task.id });
  };

  return (
    <AppModal isOpen={isOpen} size="3xl" onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader className="flex items-start gap-3 border-b border-line px-5 py-4 pr-16">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary"><CalendarDays aria-hidden size={18} /></span>
          <span className="min-w-0"><span className="block text-base font-bold leading-6 text-ink">{t("tasks.detailTitle")}</span><span className="block text-xs font-normal leading-5 text-muted">{task?.title ?? ""}</span></span>
        </ModalHeader>
        <ModalBody className="max-h-[calc(92dvh-9rem)] overflow-y-auto bg-slate-50/70 px-5 pb-7 pt-5 dark:bg-white/[0.03]">
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
              <section><p className="text-sm font-bold text-ink">{t("tasks.assigneeSummary")}</p>{task.assignees.length === 0 ? <p className="mt-2 text-sm leading-6 text-muted">{t("tasks.placeholderAssignee")}</p> : <div className="mt-3 space-y-2">{task.assignees.map((assignee) => <div key={assignee.employeeId} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2.5"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink"><UserRound aria-hidden className="shrink-0 text-muted" size={15} /><span className="truncate">{assignee.fullName}</span></span><span className="flex shrink-0 items-center gap-2"><span className="text-xs text-muted">{t(statusKey(assignee.status))}</span><Chip className="h-6 px-2 text-xs" radius="sm" size="sm" variant="flat">{assignee.progress}%</Chip></span></div>)}</div>}</section>
              <Divider className="bg-line" />
              <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-ink"><MessageSquare aria-hidden size={16} />{t("tasks.comments")}</p>
                    <Chip className="h-6 px-2 text-xs" radius="sm" size="sm" variant="flat">{task.comments.length}</Chip>
                  </div>
                  <div className="space-y-3">
                    <Textarea
                      classNames={textareaFieldClassNames}
                      label={t("tasks.newComment")}
                      labelPlacement="outside"
                      maxLength={2_000}
                      maxRows={4}
                      minRows={4}
                      placeholder={t("tasks.commentPlaceholder")}
                      value={commentBody}
                      variant="bordered"
                      onValueChange={setCommentBody}
                    />
                    <div className="flex justify-end">
                      <ActionButton color="primary" isDisabled={!commentBody.trim()} isLoading={commentMutation.isPending} size="sm" startContent={<Send aria-hidden size={15} />} onPress={postComment}>{t("tasks.postComment")}</ActionButton>
                    </div>
                  </div>
                  {task.comments.length === 0 ? <p className="rounded-lg border border-dashed border-line bg-panel/70 px-3 py-3 text-sm text-muted">{t("tasks.noComments")}</p> : null}
                  {task.comments.length > 0 ? (
                    <div className="space-y-2">
                      {task.comments.map((comment) => (
                        <article key={comment.id} className="rounded-lg border border-line bg-panel px-3 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                            <time className="text-xs text-muted" dateTime={comment.createdAt}>{dateTimeFormatter.format(new Date(comment.createdAt))}</time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{comment.body}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
                <aside className="space-y-5">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-sm font-bold text-ink"><Paperclip aria-hidden size={16} />{t("tasks.attachments")}</p>
                      <ActionButton color="primary" isLoading={uploadMutation.isPending} size="sm" startContent={<Upload aria-hidden size={15} />} variant="flat" onPress={() => fileInputRef.current?.click()}>{t("tasks.upload")}</ActionButton>
                      <input
                        ref={fileInputRef}
                        className="sr-only"
                        type="file"
                        onChange={(event) => {
                          uploadAttachment(event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </div>
                    {task.attachments.length === 0 ? <p className="rounded-lg border border-dashed border-line bg-panel/70 px-3 py-3 text-sm text-muted">{t("tasks.noAttachments")}</p> : null}
                    {task.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {task.attachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-lg border border-line bg-panel px-3 py-3">
                            <p className="truncate text-sm font-semibold text-ink">{attachment.fileName}</p>
                            <p className="mt-1 text-xs text-muted">{formatFileSize(attachment.fileSizeBytes)} - {attachment.uploaderName}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <ActionButton as="a" className="h-8 px-2 text-xs" href={`/api/tasks/${task.id}/attachments/${attachment.id}`} startContent={<Download aria-hidden size={14} />} variant="flat">{t("tasks.download")}</ActionButton>
                              {attachment.canRemove ? <ActionButton className="h-8 px-2 text-xs" color="danger" isLoading={removeMutation.isPending} startContent={<Trash2 aria-hidden size={14} />} variant="flat" onPress={() => removeMutation.mutate({ attachmentId: attachment.id, taskId: task.id })}>{t("tasks.remove")}</ActionButton> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                  <section className="space-y-3">
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-ink"><Activity aria-hidden size={16} />{t("tasks.activity")}</p>
                    {task.activity.length === 0 ? <p className="rounded-lg border border-dashed border-line bg-panel/70 px-3 py-3 text-sm text-muted">{t("tasks.noActivity")}</p> : null}
                    {task.activity.length > 0 ? (
                      <div className="space-y-2">
                        {task.activity.slice(0, 8).map((activity) => (
                          <div key={activity.id} className="rounded-lg border border-line bg-panel px-3 py-2.5">
                            <p className="text-sm font-semibold text-ink">{activity.action}</p>
                            <p className="mt-1 text-xs text-muted">{activity.actorName} - {dateTimeFormatter.format(new Date(activity.createdAt))}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </aside>
              </section>
              {mutationError ? <FormError>{formatError(mutationError, t("tasks.errorGeneric"))}</FormError> : null}
            </div>
          ) : null}
        </ModalBody>
        {task ? <ModalFooter className="shrink-0 border-t border-line bg-panel px-5 py-4"><ActionButton variant="light" onPress={onClose}>{t("admin.cancel")}</ActionButton>{task.canUpdateOwnProgress ? <ActionButton color="primary" startContent={<Gauge aria-hidden size={16} />} variant="flat" onPress={onUpdateProgress}>{t("tasks.updateProgress")}</ActionButton> : null}{task.canDelete ? <ActionButton color="danger" startContent={<Trash2 aria-hidden size={16} />} variant="flat" onPress={onDelete}>{t("tasks.delete")}</ActionButton> : null}{task.canEdit ? <ActionButton color="primary" startContent={<Pencil aria-hidden size={16} />} onPress={onEdit}>{task.canManageAssignment ? t("tasks.editAssignedTitle") : t("tasks.editTitle")}</ActionButton> : null}</ModalFooter> : null}
      </ModalContent>
    </AppModal>
  );
}
