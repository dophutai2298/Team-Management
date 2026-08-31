"use client";

import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import { ControlledSelectField, ControlledTextField, ControlledTextareaField } from "@/components/heroui/controlled-fields";
import { FormError } from "@/components/heroui/form-error";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { AssignmentProgressInput, TaskDetail, TaskStatus } from "@/lib/task/task";

const progressSchema = z
  .object({
    status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]),
    progress: z.coerce.number().int().min(0, "Enter a value from 0 to 100.").max(100, "Enter a value from 0 to 100."),
    blockedReason: z.string().trim().max(1_000, "Keep this under 1,000 characters."),
  })
  .superRefine((values, context) => {
    if (values.status === "blocked" && values.blockedReason.length < 3) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Explain what is blocking this work.", path: ["blockedReason"] });
    }
  });

type ProgressValues = z.infer<typeof progressSchema>;

type TaskProgressModalProps = {
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  task: TaskDetail | null;
  onClose: () => void;
  onSubmit: (input: AssignmentProgressInput) => void;
};

function defaultValues(task: TaskDetail | null): ProgressValues {
  const current = task?.ownAssignee;

  return {
    status: current?.status ?? "todo",
    progress: current?.progress ?? 0,
    blockedReason: current?.blockedReason ?? "",
  };
}

export function TaskProgressModal({ error, isOpen, isSubmitting, task, onClose, onSubmit }: TaskProgressModalProps) {
  const { t } = useLocale();
  const form = useForm<ProgressValues>({ resolver: zodResolver(progressSchema), defaultValues: defaultValues(task) });
  const status = useWatch({ control: form.control, name: "status" });

  useEffect(() => form.reset(defaultValues(task)), [form, task]);

  return (
    <AppModal isOpen={isOpen} size="lg" onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <ModalContent>
        <form onSubmit={form.handleSubmit((values) => onSubmit({ status: values.status as TaskStatus, progress: values.status === "done" ? 100 : values.progress, blockedReason: values.status === "blocked" ? values.blockedReason.trim() || null : null }))}>
          <ModalHeader className="flex items-start gap-3 border-b border-line px-5 py-4 pr-16">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary"><Gauge aria-hidden size={18} /></span>
            <span className="min-w-0"><span className="block text-base font-bold leading-6 text-ink">{t("tasks.progressTitle")}</span><span className="mt-0.5 block truncate text-xs font-normal leading-5 text-muted">{task?.title ?? ""}</span></span>
          </ModalHeader>
          <ModalBody className="space-y-4 bg-slate-50/70 px-5 py-5 dark:bg-white/[0.03]">
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
            <ControlledTextField control={form.control} isRequired label={t("tasks.progress")} max={100} min={0} name="progress" type="number" />
            {status === "blocked" ? <ControlledTextareaField isRequired control={form.control} label={t("tasks.blockedReason")} maxLength={1_000} name="blockedReason" placeholder={t("tasks.blockedReasonPlaceholder")} /> : null}
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line bg-panel px-5 py-4">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>{t("admin.cancel")}</ActionButton>
            <ActionButton color="primary" isLoading={isSubmitting} startContent={<Save aria-hidden size={16} />} type="submit">{t("tasks.saveProgress")}</ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
