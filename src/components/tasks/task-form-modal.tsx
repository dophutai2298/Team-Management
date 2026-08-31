"use client";

import { ModalBody, ModalContent, ModalFooter, ModalHeader, Tab, Tabs } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Save, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/components/heroui/action-button";
import { AppModal } from "@/components/heroui/app-modal";
import {
  ControlledMultiSelectField,
  ControlledSelectField,
  ControlledTextField,
  ControlledTextareaField,
} from "@/components/heroui/controlled-fields";
import { FormError } from "@/components/heroui/form-error";
import { useLocale } from "@/lib/i18n/locale-provider";
import type {
  AssignedTaskInput,
  PersonalTaskInput,
  TaskAssignmentOptions,
  TaskDetail,
  TaskPriority,
  TaskStatus,
} from "@/lib/task/task";

const taskSchema = z
  .object({
    taskType: z.enum(["personal", "assigned"]),
    title: z.string().trim().min(2, "Enter a task title.").max(160, "Keep this under 160 characters."),
    description: z.string().trim().max(2_000, "Keep this under 2,000 characters."),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]),
    dueDate: z.string().optional(),
    employeeIds: z.array(z.string().uuid()),
    teamId: z.union([z.string().uuid(), z.literal("")]),
  })
  .superRefine((values, context) => {
    if (values.taskType === "assigned" && values.employeeIds.length === 0 && !values.teamId) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one person or team.", path: ["employeeIds"] });
    }
  });

type TaskFormValues = z.infer<typeof taskSchema>;
type TaskFormInput = PersonalTaskInput | AssignedTaskInput;

type TaskFormModalProps = {
  assignmentOptions: TaskAssignmentOptions | null;
  error?: string;
  isAssignmentOptionsLoading?: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  task: TaskDetail | null;
  onClose: () => void;
  onSubmit: (input: TaskFormInput) => void;
};

function defaultValues(task: TaskDetail | null): TaskFormValues {
  return {
    taskType: task?.taskType ?? "personal",
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "medium",
    status: task?.status ?? "todo",
    dueDate: task?.dueDate ?? "",
    employeeIds: task?.assignees.map((assignee) => assignee.employeeId) ?? [],
    teamId: task?.teamId ?? "",
  };
}

export function TaskFormModal({
  assignmentOptions,
  error,
  isAssignmentOptionsLoading,
  isOpen,
  isSubmitting,
  task,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const { t } = useLocale();
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: defaultValues(task) });
  const taskType = useWatch({ control: form.control, name: "taskType" });
  const isAssignedTask = taskType === "assigned";
  const canChooseAssignedTask = Boolean(assignmentOptions?.canAssign);

  useEffect(() => form.reset(defaultValues(task)), [form, task]);

  const employeeOptions = (assignmentOptions?.employees ?? []).map((employee) => ({
    id: employee.id,
    name: employee.fullName,
    detail: [employee.employeeCode, ...employee.teamNames].filter(Boolean).join(" - ") || undefined,
  }));
  const teamOptions = (assignmentOptions?.teams ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    detail: `${team.employeeIds.length}`,
  }));

  return (
    <AppModal isOpen={isOpen} size="2xl" onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <ModalContent>
        <form
          onSubmit={form.handleSubmit((values) => {
            if (values.taskType === "assigned") {
              onSubmit({
                title: values.title,
                description: values.description.trim() || null,
                priority: values.priority as TaskPriority,
                dueDate: values.dueDate || null,
                employeeIds: values.employeeIds,
                teamId: values.teamId || null,
              });
              return;
            }

            onSubmit({
              title: values.title,
              description: values.description.trim() || null,
              priority: values.priority as TaskPriority,
              status: values.status as TaskStatus,
              dueDate: values.dueDate || null,
            });
          })}
        >
          <ModalHeader className="flex items-start gap-3 border-b border-line px-5 py-4 pr-16">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
              {isAssignedTask ? <UsersRound aria-hidden size={18} /> : <CalendarDays aria-hidden size={18} />}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold leading-6 text-ink">
                {task ? (isAssignedTask ? t("tasks.editAssignedTitle") : t("tasks.editTitle")) : (isAssignedTask ? t("tasks.newAssignedTitle") : t("tasks.newTitle"))}
              </span>
              <span className="mt-0.5 block text-xs font-normal leading-5 text-muted">
                {isAssignedTask ? t("tasks.assignedFormDescription") : t("tasks.formDescription")}
              </span>
            </span>
          </ModalHeader>
          <ModalBody className="max-h-[calc(92dvh-9rem)] overflow-y-auto bg-slate-50/70 px-5 py-5 dark:bg-white/[0.03]">
            {!task ? (
              <Tabs
                aria-label={t("tasks.assignmentMode")}
                classNames={{ tabList: "w-full rounded-lg bg-panel p-1", tab: "h-9 text-sm", cursor: "rounded-md bg-primary" }}
                selectedKey={taskType}
                variant="solid"
                onSelectionChange={(key) => form.setValue("taskType", String(key) as TaskFormValues["taskType"], { shouldValidate: true })}
              >
                <Tab key="personal" title={t("tasks.personalMode")} />
                <Tab isDisabled={!canChooseAssignedTask} key="assigned" title={t("tasks.assignedMode")} />
              </Tabs>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              {isAssignedTask ? (
                <ControlledTextField control={form.control} label={t("tasks.dueDate")} name="dueDate" type="date" />
              ) : (
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
              )}
              {!isAssignedTask ? <ControlledTextField control={form.control} label={t("tasks.dueDate")} name="dueDate" type="date" /> : null}
              {isAssignedTask ? (
                <>
                  <div className="sm:col-span-2">
                    {isAssignmentOptionsLoading ? <p className="text-sm text-muted">{t("tasks.assignmentOptionsLoading")}</p> : null}
                    {!isAssignmentOptionsLoading && employeeOptions.length === 0 ? <FormError>{t("tasks.noEligibleAssignees")}</FormError> : null}
                    {!isAssignmentOptionsLoading && employeeOptions.length > 0 ? <ControlledMultiSelectField ariaLabel={t("tasks.assignees")} control={form.control} label={t("tasks.assignees")} name="employeeIds" options={employeeOptions} placeholder={t("tasks.selectAssignees")} /> : null}
                  </div>
                  {teamOptions.length > 0 ? <ControlledSelectField ariaLabel={t("tasks.team")} control={form.control} label={t("tasks.team")} name="teamId" options={teamOptions} placeholder={t("tasks.selectTeam")} /> : null}
                  <p className="self-end text-xs leading-5 text-muted">{t("tasks.assignmentHint")}</p>
                </>
              ) : null}
              <div className="sm:col-span-2">
                <ControlledTextareaField control={form.control} label={t("tasks.descriptionLabel")} maxLength={2_000} name="description" placeholder={t("tasks.descriptionPlaceholder")} />
              </div>
            </div>
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line bg-panel px-5 py-4">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>{t("admin.cancel")}</ActionButton>
            <ActionButton color="primary" isDisabled={isAssignedTask && (isAssignmentOptionsLoading || !canChooseAssignedTask)} isLoading={isSubmitting} startContent={<Save aria-hidden size={16} />} type="submit">{t("tasks.save")}</ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
