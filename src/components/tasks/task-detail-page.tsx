"use client";

import { Chip, Divider, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton, Textarea } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Gauge,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ActionButton } from "@/components/heroui/action-button";
import { showSuccessToast } from "@/components/heroui/app-toast";
import { AppModal } from "@/components/heroui/app-modal";
import { textareaFieldClassNames } from "@/components/heroui/field-styles";
import { FormError } from "@/components/heroui/form-error";
import { EmptyPanel } from "@/components/workspace/empty-panel";
import { PageHeader } from "@/components/workspace/page-header";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { ApiClientError, fetchApi } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { createScopedQueryKey } from "@/lib/query-client";
import type {
  AssignedTaskInput,
  AssignmentProgressInput,
  PersonalTaskInput,
  TaskAssignmentOptions,
  TaskDetail,
  TaskPriority,
  TaskStatus,
} from "@/lib/task/task";
import { TASK_ATTACHMENT_MAX_BYTES, TASK_ATTACHMENT_MAX_FILES } from "@/lib/task/task";

import { TaskFormModal } from "./task-form-modal";
import { TaskProgressModal } from "./task-progress-modal";

type TaskDetailPageProps = {
  actorCacheKey: string;
  taskId: string;
};

type TaskDetailPayload = { task: TaskDetail };
type TaskAssignmentOptionsPayload = TaskAssignmentOptions;
type TaskFormInput = PersonalTaskInput | AssignedTaskInput;

function isAssignedTaskInput(input: TaskFormInput): input is AssignedTaskInput {
  return "employeeIds" in input;
}

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

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Skeleton className="h-96 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

export function TaskDetailPage({ actorCacheKey, taskId }: TaskDetailPageProps) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentBody, setCommentBody] = useState("");
  const [clientAttachmentError, setClientAttachmentError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const taskListQueryKey = createScopedQueryKey(actorCacheKey, "tasks");
  const taskDetailQueryKey = createScopedQueryKey(actorCacheKey, "tasks", "detail", taskId);
  const assignmentOptionsQueryKey = createScopedQueryKey(actorCacheKey, "tasks", "assignment-options");
  const taskQuery = useQuery({
    queryKey: taskDetailQueryKey,
    queryFn: () => fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}`),
  });
  const assignmentOptionsQuery = useQuery({
    queryKey: assignmentOptionsQueryKey,
    queryFn: () => fetchApi<TaskAssignmentOptionsPayload>("/api/tasks/assignment-options"),
    enabled: editOpen,
  });

  const dateFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const task = taskQuery.data?.task ?? null;
  const canUploadMore = Boolean(task && task.attachments.length < TASK_ATTACHMENT_MAX_FILES);

  const syncTask = async (data: TaskDetailPayload) => {
    queryClient.setQueryData(createScopedQueryKey(actorCacheKey, "tasks", "detail", data.task.id), data);
    await queryClient.invalidateQueries({ queryKey: taskListQueryKey });
  };

  const commentMutation = useMutation({
    mutationFn: ({ body, taskId: targetTaskId }: { body: string; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${targetTaskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: async (data) => {
      setCommentBody("");
      showSuccessToast(t("tasks.toastCommentPosted"));
      await syncTask(data);
    },
  });
  const uploadMutation = useMutation({
    mutationFn: ({ formData, taskId: targetTaskId }: { formData: FormData; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${targetTaskId}/attachments`, { method: "POST", body: formData }),
    onSuccess: async (data) => {
      setClientAttachmentError(null);
      showSuccessToast(t("tasks.toastAttachmentUploaded"));
      await syncTask(data);
    },
  });
  const removeMutation = useMutation({
    mutationFn: ({ attachmentId, taskId: targetTaskId }: { attachmentId: string; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${targetTaskId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: async (data) => {
      showSuccessToast(t("tasks.toastAttachmentRemoved"));
      await syncTask(data);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ input, taskId: targetTaskId }: { input: TaskFormInput; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${targetTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAssignedTaskInput(input) ? { ...input, taskType: "assigned" } : input),
      }),
    onSuccess: async (data) => {
      setEditOpen(false);
      showSuccessToast(t("tasks.toastUpdated"));
      await syncTask(data);
    },
  });
  const progressMutation = useMutation({
    mutationFn: ({ employeeId, input, taskId: targetTaskId }: { employeeId: string; input: AssignmentProgressInput; taskId: string }) =>
      fetchApi<TaskDetailPayload>(`/api/tasks/${targetTaskId}/assignees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async (data) => {
      setProgressOpen(false);
      showSuccessToast(t("tasks.toastProgressUpdated"));
      await syncTask(data);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (targetTaskId: string) => fetchApi<{ id: string }>(`/api/tasks/${targetTaskId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskListQueryKey });
      showSuccessToast(t("tasks.toastDeleted"));
      router.push("/tasks");
    },
  });

  const postComment = () => {
    if (!task) return;
    const body = commentBody.trim();
    if (!body) return;
    commentMutation.mutate({ body, taskId: task.id });
  };

  const uploadAttachment = (file: File | undefined) => {
    if (!file || !task) return;
    setClientAttachmentError(null);

    if (task.attachments.length >= TASK_ATTACHMENT_MAX_FILES) {
      setClientAttachmentError(t("tasks.attachmentLimitReached"));
      return;
    }

    if (file.size > TASK_ATTACHMENT_MAX_BYTES) {
      setClientAttachmentError(t("tasks.attachmentTooLarge"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    uploadMutation.mutate({ formData, taskId: task.id });
  };

  const mutationError = commentMutation.error ?? uploadMutation.error ?? removeMutation.error;
  const loadError = taskQuery.isError ? errorMessage(taskQuery.error, t("tasks.errorGeneric")) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        actions={
          <>
            <ActionButton startContent={<ArrowLeft aria-hidden size={16} />} variant="flat" onPress={() => router.push("/tasks")}>
              {t("tasks.backToList")}
            </ActionButton>
            {task?.canUpdateOwnProgress ? (
              <ActionButton color="primary" startContent={<Gauge aria-hidden size={16} />} variant="flat" onPress={() => setProgressOpen(true)}>
                {t("tasks.updateProgress")}
              </ActionButton>
            ) : null}
            {task?.canEdit ? (
              <ActionButton color="primary" startContent={<Pencil aria-hidden size={16} />} onPress={() => setEditOpen(true)}>
                {task.canManageAssignment ? t("tasks.editAssignedTitle") : t("tasks.editTitle")}
              </ActionButton>
            ) : null}
          </>
        }
        description={task?.title ?? t("tasks.tableDescription")}
        eyebrow={t("tasks.eyebrow")}
        title={t("tasks.detailTitle")}
      />

      {taskQuery.isPending ? <DetailSkeleton /> : null}
      {loadError ? (
        <div className="mt-7">
          <EmptyPanel
            action={<ActionButton color="primary" onPress={() => void taskQuery.refetch()}>{t("admin.retry")}</ActionButton>}
            description={loadError}
            icon={AlertCircle}
            title={t("tasks.loadError")}
          />
        </div>
      ) : null}

      {task && !taskQuery.isPending && !loadError ? (
        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <WorkspacePanel
            action={
              task.canDelete ? (
                <ActionButton color="danger" startContent={<Trash2 aria-hidden size={16} />} variant="flat" onPress={() => setDeleteOpen(true)}>
                  {t("tasks.delete")}
                </ActionButton>
              ) : null
            }
            description={task.description || t("tasks.placeholderAssignee")}
            id="task-detail-summary"
            title={task.title}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold text-muted">{t("tasks.type")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{t(task.taskType === "personal" ? "tasks.personal" : "tasks.assigned")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted">{t("tasks.priority")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{t(priorityKey(task.priority))}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted">{t("tasks.status")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{t(statusKey(task.status))}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted">{t("tasks.dueDate")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {task.dueDate ? dateFormatter.format(new Date(`${task.dueDate}T00:00:00`)) : t("tasks.noDueDate")}
                  </p>
                </div>
              </div>

              <Divider className="bg-line" />

              <section>
                <p className="text-sm font-bold text-ink">{t("tasks.assigneeSummary")}</p>
                {task.assignees.length === 0 ? (
                  <p className="mt-2 text-sm leading-6 text-muted">{t("tasks.placeholderAssignee")}</p>
                ) : (
                  <div className="mt-3 grid gap-2 lg:grid-cols-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.employeeId} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-slate-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
                        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                          <UserRound aria-hidden className="shrink-0 text-muted" size={15} />
                          <span className="truncate">{assignee.fullName}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-muted">{t(statusKey(assignee.status))}</span>
                          <Chip className="h-6 px-2 text-xs" radius="sm" size="sm" variant="flat">{assignee.progress}%</Chip>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Divider className="bg-line" />

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
                    <MessageSquare aria-hidden size={16} />
                    {t("tasks.comments")}
                  </p>
                  <Chip className="h-6 px-2 text-xs" radius="sm" size="sm" variant="flat">{task.comments.length}</Chip>
                </div>
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
                  <ActionButton
                    color="primary"
                    isDisabled={!commentBody.trim()}
                    isLoading={commentMutation.isPending}
                    size="sm"
                    startContent={<Send aria-hidden size={15} />}
                    onPress={postComment}
                  >
                    {t("tasks.postComment")}
                  </ActionButton>
                </div>
                {task.comments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line bg-slate-50/80 px-3 py-3 text-sm text-muted dark:bg-white/[0.03]">{t("tasks.noComments")}</p>
                ) : (
                  <div className="space-y-2">
                    {task.comments.map((comment) => (
                      <article key={comment.id} className="rounded-lg border border-line bg-slate-50/80 px-3 py-3 dark:bg-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                          <time className="text-xs text-muted" dateTime={comment.createdAt}>{dateTimeFormatter.format(new Date(comment.createdAt))}</time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{comment.body}</p>
                      </article>
                    ))}
                  </div>
                )}
                {mutationError ? <FormError>{errorMessage(mutationError, t("tasks.errorGeneric"))}</FormError> : null}
              </section>
            </div>
          </WorkspacePanel>

          <aside className="space-y-5">
            <WorkspacePanel
              action={
                <ActionButton
                  color="primary"
                  isDisabled={!canUploadMore}
                  isLoading={uploadMutation.isPending}
                  size="sm"
                  startContent={<Upload aria-hidden size={15} />}
                  variant="flat"
                  onPress={() => fileInputRef.current?.click()}
                >
                  {t("tasks.upload")}
                </ActionButton>
              }
              description={t("tasks.attachmentLimitHint")}
              id="task-attachments"
              title={t("tasks.attachments")}
            >
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                onChange={(event) => {
                  uploadAttachment(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <div className="space-y-3">
                {!canUploadMore ? <FormError>{t("tasks.attachmentLimitReached")}</FormError> : null}
                {clientAttachmentError ? <FormError>{clientAttachmentError}</FormError> : null}
                {task.attachments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line bg-slate-50/80 px-3 py-3 text-sm text-muted dark:bg-white/[0.03]">{t("tasks.noAttachments")}</p>
                ) : (
                  task.attachments.map((attachment) => (
                    <div key={attachment.id} className="rounded-lg border border-line bg-slate-50/80 px-3 py-3 dark:bg-white/[0.03]">
                      <p className="truncate text-sm font-semibold text-ink">{attachment.fileName}</p>
                      <p className="mt-1 text-xs text-muted">{formatFileSize(attachment.fileSizeBytes)} - {attachment.uploaderName}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <ActionButton
                          as="a"
                          className="h-8 px-2 text-xs"
                          href={`/api/tasks/${task.id}/attachments/${attachment.id}`}
                          startContent={<Download aria-hidden size={14} />}
                          variant="flat"
                        >
                          {t("tasks.download")}
                        </ActionButton>
                        {attachment.canRemove ? (
                          <ActionButton
                            className="h-8 px-2 text-xs"
                            color="danger"
                            isLoading={removeMutation.isPending}
                            startContent={<Trash2 aria-hidden size={14} />}
                            variant="flat"
                            onPress={() => removeMutation.mutate({ attachmentId: attachment.id, taskId: task.id })}
                          >
                            {t("tasks.remove")}
                          </ActionButton>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </WorkspacePanel>

            <WorkspacePanel id="task-activity" title={t("tasks.activity")}>
              {task.activity.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-slate-50/80 px-3 py-3 text-sm text-muted dark:bg-white/[0.03]">{t("tasks.noActivity")}</p>
              ) : (
                <div className="space-y-2">
                  {task.activity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-line bg-slate-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
                      <p className="text-sm font-semibold text-ink">{activity.action}</p>
                      <p className="mt-1 text-xs text-muted">{activity.actorName} - {dateTimeFormatter.format(new Date(activity.createdAt))}</p>
                    </div>
                  ))}
                </div>
              )}
            </WorkspacePanel>
          </aside>
        </div>
      ) : null}

      <TaskFormModal
        assignmentOptions={assignmentOptionsQuery.data ?? null}
        error={updateMutation.isError ? errorMessage(updateMutation.error, t("tasks.errorGeneric")) : undefined}
        isAssignmentOptionsLoading={assignmentOptionsQuery.isPending}
        isOpen={editOpen}
        isSubmitting={updateMutation.isPending}
        mode="edit"
        task={task}
        onClose={() => setEditOpen(false)}
        onSubmit={(input) => task && updateMutation.mutate({ input, taskId: task.id })}
      />
      <TaskProgressModal
        error={progressMutation.isError ? errorMessage(progressMutation.error, t("tasks.errorGeneric")) : undefined}
        isOpen={progressOpen && Boolean(task?.ownAssignee)}
        isSubmitting={progressMutation.isPending}
        task={task}
        onClose={() => setProgressOpen(false)}
        onSubmit={(input) => task?.ownAssignee && progressMutation.mutate({ employeeId: task.ownAssignee.employeeId, input, taskId: task.id })}
      />
      <AppModal isOpen={deleteOpen} size="md" onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteOpen(false)}>
        <ModalContent>
          <ModalHeader className="border-b border-line px-5 py-4 pr-16 text-base font-bold text-ink">{t("tasks.deleteTitle")}</ModalHeader>
          <ModalBody className="bg-slate-50/70 px-5 py-5 text-sm leading-6 text-muted dark:bg-white/[0.03]">
            {t("tasks.deleteDescription")}
            {deleteMutation.isError ? <p className="mt-3 text-danger">{errorMessage(deleteMutation.error, t("tasks.errorGeneric"))}</p> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line bg-panel px-5 py-4">
            <ActionButton isDisabled={deleteMutation.isPending} variant="light" onPress={() => setDeleteOpen(false)}>{t("admin.cancel")}</ActionButton>
            <ActionButton color="danger" isLoading={deleteMutation.isPending} onPress={() => task && deleteMutation.mutate(task.id)}>{t("tasks.delete")}</ActionButton>
          </ModalFooter>
        </ModalContent>
      </AppModal>
    </div>
  );
}
