"use client";

import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import { ControlledSelectField, ControlledTextField, ControlledTextareaField } from "@/components/heroui/controlled-fields";
import { FormError } from "@/components/heroui/form-error";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { PersonalTaskInput, TaskDetail, TaskPriority, TaskStatus } from "@/lib/task/task";

const taskSchema = z.object({
  title: z.string().trim().min(2, "Enter a task title.").max(160, "Keep this under 160 characters."),
  description: z.string().trim().max(2_000, "Keep this under 2,000 characters."),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskFormModalProps = {
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  task: TaskDetail | null;
  onClose: () => void;
  onSubmit: (input: PersonalTaskInput) => void;
};

function defaultValues(task: TaskDetail | null): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "medium",
    status: task?.status ?? "todo",
    dueDate: task?.dueDate ?? "",
  };
}

export function TaskFormModal({ error, isOpen, isSubmitting, task, onClose, onSubmit }: TaskFormModalProps) {
  const { t } = useLocale();
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: defaultValues(task) });

  useEffect(() => form.reset(defaultValues(task)), [form, task]);

  return (
    <AppModal isOpen={isOpen} size="2xl" onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <ModalContent>
        <form
          onSubmit={form.handleSubmit((values) =>
            onSubmit({
              title: values.title,
              description: values.description.trim() || null,
              priority: values.priority as TaskPriority,
              status: values.status as TaskStatus,
              dueDate: values.dueDate || null,
            }),
          )}
        >
          <ModalHeader className="flex items-start gap-3 border-b border-line px-5 py-4 pr-16">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary"><CalendarDays aria-hidden size={18} /></span>
            <span className="min-w-0">
              <span className="block text-base font-bold leading-6 text-ink">{task ? t("tasks.editTitle") : t("tasks.newTitle")}</span>
              <span className="mt-0.5 block text-xs font-normal leading-5 text-muted">{t("tasks.formDescription")}</span>
            </span>
          </ModalHeader>
          <ModalBody className="max-h-[calc(92dvh-9rem)] overflow-y-auto bg-slate-50/70 px-5 py-5 dark:bg-white/[0.03]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ControlledTextField isRequired control={form.control} label={t("tasks.taskTitle")} name="title" placeholder={t("tasks.taskTitlePlaceholder")} />
              </div>
              <ControlledSelectField
                isRequired
                ariaLabel={t("tasks.priority")}
                control={form.control}
                label={t("tasks.priority")}
                name="priority"
                options={[
                  { id: "low", name: t("tasks.low") },
                  { id: "medium", name: t("tasks.medium") },
                  { id: "high", name: t("tasks.high") },
                  { id: "urgent", name: t("tasks.urgent") },
                ]}
                placeholder={t("tasks.priority")}
              />
              <ControlledSelectField
                isRequired
                ariaLabel={t("tasks.status")}
                control={form.control}
                label={t("tasks.status")}
                name="status"
                options={[
                  { id: "todo", name: t("tasks.todo") },
                  { id: "in_progress", name: t("tasks.inProgress") },
                  { id: "blocked", name: t("tasks.blocked") },
                  { id: "done", name: t("tasks.done") },
                  { id: "cancelled", name: t("tasks.cancelled") },
                ]}
                placeholder={t("tasks.status")}
              />
              <ControlledTextField control={form.control} label={t("tasks.dueDate")} name="dueDate" type="date" />
              <div className="sm:col-span-2">
                <ControlledTextareaField control={form.control} label={t("tasks.descriptionLabel")} maxLength={2_000} name="description" placeholder={t("tasks.descriptionPlaceholder")} />
              </div>
            </div>
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line bg-panel px-5 py-4">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>{t("admin.cancel")}</ActionButton>
            <ActionButton color="primary" isLoading={isSubmitting} startContent={<Save aria-hidden size={16} />} type="submit">{t("tasks.save")}</ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
