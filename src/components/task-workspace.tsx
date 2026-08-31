"use client";

import { Chip, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

import { TasksTable } from "@/components/data-table/tasks-table";
import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskProgressModal } from "@/components/tasks/task-progress-modal";
import { EmptyPanel } from "@/components/workspace/empty-panel";
import { PageHeader } from "@/components/workspace/page-header";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { ApiClientError, fetchApi } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { AssignedTaskInput, AssignmentProgressInput, PersonalTaskInput, TaskAssignmentOptions, TaskDetail, TaskSummary } from "@/lib/task/task";

type TaskListPayload = { tasks: TaskSummary[] };
type TaskDetailPayload = { task: TaskDetail };
type TaskAssignmentOptionsPayload = TaskAssignmentOptions;
type TaskFormInput = PersonalTaskInput | AssignedTaskInput;

function isAssignedTaskInput(input: TaskFormInput): input is AssignedTaskInput {
  return "employeeIds" in input;
}

function TaskSkeleton() {
  return <div aria-busy="true" className="space-y-3"><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full rounded-lg" /></div>;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function TaskWorkspace() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [progressTaskId, setProgressTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: () => fetchApi<TaskListPayload>("/api/tasks") });
  const viewingTaskQuery = useQuery({
    queryKey: ["tasks", viewingTaskId],
    queryFn: () => fetchApi<TaskDetailPayload>(`/api/tasks/${viewingTaskId}`),
    enabled: Boolean(viewingTaskId),
  });
  const editingTaskQuery = useQuery({
    queryKey: ["tasks", editingTaskId],
    queryFn: () => fetchApi<TaskDetailPayload>(`/api/tasks/${editingTaskId}`),
    enabled: Boolean(editingTaskId),
  });
  const progressTaskQuery = useQuery({
    queryKey: ["tasks", progressTaskId],
    queryFn: () => fetchApi<TaskDetailPayload>(`/api/tasks/${progressTaskId}`),
    enabled: Boolean(progressTaskId),
  });
  const assignmentOptionsQuery = useQuery({
    queryKey: ["tasks", "assignment-options"],
    queryFn: () => fetchApi<TaskAssignmentOptionsPayload>("/api/tasks/assignment-options"),
    enabled: createOpen || Boolean(editingTaskId),
  });
  const createMutation = useMutation({
    mutationFn: (input: TaskFormInput) => fetchApi<TaskDetailPayload>("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isAssignedTaskInput(input) ? { ...input, taskType: "assigned" } : input) }),
    onSuccess: async () => { setCreateOpen(false); await queryClient.invalidateQueries({ queryKey: ["tasks"] }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TaskFormInput }) => fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isAssignedTaskInput(input) ? { ...input, taskType: "assigned" } : input) }),
    onSuccess: async (data) => {
      setEditingTaskId(null);
      setViewingTaskId(data.task.id);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", data.task.id] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => fetchApi<{ id: string }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: async () => {
      setDeleteTaskId(null);
      setViewingTaskId(null);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const progressMutation = useMutation({
    mutationFn: ({ taskId, employeeId, input }: { taskId: string; employeeId: string; input: AssignmentProgressInput }) => fetchApi<TaskDetailPayload>(`/api/tasks/${taskId}/assignees/${employeeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
    onSuccess: async (data) => {
      setProgressTaskId(null);
      setViewingTaskId(data.task.id);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", data.task.id] });
    },
  });
  const tasks = tasksQuery.data?.tasks ?? [];
  const viewingTask = viewingTaskQuery.data?.task ?? null;
  const editingTask = editingTaskQuery.data?.task ?? null;
  const progressTask = progressTaskQuery.data?.task ?? null;

  const openTaskEditor = (taskId: string) => {
    setViewingTaskId(null);
    setEditingTaskId(taskId);
  };

  const openTaskProgress = (taskId: string) => {
    setViewingTaskId(null);
    setProgressTaskId(taskId);
  };

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        actions={<><Chip className="h-8 px-2.5 text-xs font-semibold" color="primary" radius="sm" variant="flat">{tasks.length} {t("tasks.count")}</Chip><ActionButton color="primary" startContent={<Plus aria-hidden size={16} />} onPress={() => { createMutation.reset(); setCreateOpen(true); }}>{t("tasks.create")}</ActionButton></>}
        description={t("tasks.description")}
        eyebrow={t("tasks.eyebrow")}
        title={t("tasks.title")}
      />
      <section aria-labelledby="tasks-table-title" className="mt-7">
        <WorkspacePanel
          action={tasksQuery.isError ? <ActionButton color="danger" isLoading={tasksQuery.isFetching} size="sm" startContent={<RefreshCw aria-hidden size={15} />} variant="flat" onPress={() => void tasksQuery.refetch()}>{t("admin.retry")}</ActionButton> : null}
          description={t("tasks.tableDescription")}
          id="tasks-table-title"
          title={t("tasks.tableTitle")}
        >
          {tasksQuery.isPending ? <TaskSkeleton /> : null}
          {tasksQuery.isError ? <EmptyPanel action={<ActionButton color="primary" size="sm" onPress={() => void tasksQuery.refetch()}>{t("admin.retry")}</ActionButton>} description={errorMessage(tasksQuery.error, t("tasks.errorGeneric"))} icon={AlertCircle} title={t("tasks.loadError")} /> : null}
          {!tasksQuery.isPending && !tasksQuery.isError && tasks.length === 0 ? <EmptyPanel action={<ActionButton color="primary" startContent={<Plus aria-hidden size={16} />} onPress={() => setCreateOpen(true)}>{t("tasks.create")}</ActionButton>} description={t("tasks.emptyDescription")} icon={ClipboardList} title={t("tasks.emptyTitle")} /> : null}
          {!tasksQuery.isPending && !tasksQuery.isError && tasks.length > 0 ? <div className="-mx-5 -mb-5 md:-mx-6 md:-mb-6"><TasksTable tasks={tasks} onDelete={setDeleteTaskId} onEdit={setEditingTaskId} onView={setViewingTaskId} /></div> : null}
        </WorkspacePanel>
      </section>
      <TaskDetailModal error={viewingTaskQuery.isError ? errorMessage(viewingTaskQuery.error, t("tasks.errorGeneric")) : undefined} isLoading={viewingTaskQuery.isPending} isOpen={Boolean(viewingTaskId)} task={viewingTask} onClose={() => setViewingTaskId(null)} onDelete={() => viewingTask && setDeleteTaskId(viewingTask.id)} onEdit={() => viewingTask && openTaskEditor(viewingTask.id)} onUpdateProgress={() => viewingTask && openTaskProgress(viewingTask.id)} />
      <TaskFormModal assignmentOptions={assignmentOptionsQuery.data ?? null} error={createMutation.isError ? errorMessage(createMutation.error, t("tasks.errorGeneric")) : undefined} isAssignmentOptionsLoading={assignmentOptionsQuery.isPending} isOpen={createOpen} isSubmitting={createMutation.isPending} task={null} onClose={() => setCreateOpen(false)} onSubmit={(input) => createMutation.mutate(input)} />
      <TaskFormModal assignmentOptions={assignmentOptionsQuery.data ?? null} error={updateMutation.isError ? errorMessage(updateMutation.error, t("tasks.errorGeneric")) : undefined} isAssignmentOptionsLoading={assignmentOptionsQuery.isPending} isOpen={Boolean(editingTaskId && editingTask)} isSubmitting={updateMutation.isPending} task={editingTask} onClose={() => setEditingTaskId(null)} onSubmit={(input) => editingTaskId && updateMutation.mutate({ taskId: editingTaskId, input })} />
      <TaskProgressModal error={progressMutation.isError ? errorMessage(progressMutation.error, t("tasks.errorGeneric")) : undefined} isOpen={Boolean(progressTaskId) && Boolean(progressTask?.ownAssignee)} isSubmitting={progressMutation.isPending} task={progressTask} onClose={() => setProgressTaskId(null)} onSubmit={(input) => progressTask?.ownAssignee && progressTaskId && progressMutation.mutate({ taskId: progressTaskId, employeeId: progressTask.ownAssignee.employeeId, input })} />
      <AppModal isOpen={Boolean(deleteTaskId)} size="md" onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTaskId(null)}>
        <ModalContent><ModalHeader className="border-b border-line px-5 py-4 pr-16 text-base font-bold text-ink">{t("tasks.deleteTitle")}</ModalHeader><ModalBody className="bg-slate-50/70 px-5 py-5 text-sm leading-6 text-muted dark:bg-white/[0.03]">{t("tasks.deleteDescription")}{deleteMutation.isError ? <p className="mt-3 text-danger">{errorMessage(deleteMutation.error, t("tasks.errorGeneric"))}</p> : null}</ModalBody><ModalFooter className="border-t border-line bg-panel px-5 py-4"><ActionButton isDisabled={deleteMutation.isPending} variant="light" onPress={() => setDeleteTaskId(null)}>{t("admin.cancel")}</ActionButton><ActionButton color="danger" isLoading={deleteMutation.isPending} onPress={() => deleteTaskId && deleteMutation.mutate(deleteTaskId)}>{t("tasks.delete")}</ActionButton></ModalFooter></ModalContent>
      </AppModal>
    </div>
  );
}
