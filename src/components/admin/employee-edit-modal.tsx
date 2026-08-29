"use client";

import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Save } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { AdminEmployeeInput, EmployeeManagementOptions, EmployeeSummary } from "@/lib/employee/profile";
import { useLocale } from "@/lib/i18n/locale-provider";

import { AppModal } from "../heroui/app-modal";
import { ControlledSelectField, ControlledTextField } from "../heroui/controlled-fields";
import { FormError } from "../heroui/form-error";
import { ActionButton } from "../heroui/action-button";

const NONE_MANAGER = "none";

const employeeSchema = z.object({
  employeeCode: z.string().trim().min(2, "Enter an employee code.").max(64, "Keep this under 64 characters."),
  teamId: z.string().uuid("Select a team."),
  managerEmployeeId: z.string(),
  roleId: z.string().uuid("Select a role."),
  positionTitle: z.string().trim().max(120, "Keep this under 120 characters.").optional(),
  levelName: z.string().trim().max(120, "Keep this under 120 characters.").optional(),
  accountStatus: z.enum(["active", "disabled", "terminated"]),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

type EmployeeEditModalProps = {
  employee: EmployeeSummary;
  error?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: AdminEmployeeInput) => void;
  options: EmployeeManagementOptions;
};

function toFormValues(employee: EmployeeSummary): EmployeeFormValues {
  return {
    employeeCode: employee.employeeCode ?? "",
    teamId: employee.teamId ?? "",
    managerEmployeeId: employee.managerEmployeeId ?? NONE_MANAGER,
    roleId: employee.roleId ?? "",
    positionTitle: employee.positionTitle ?? "",
    levelName: employee.levelName ?? "",
    accountStatus: employee.accountStatus === "pending_approval" ? "active" : employee.accountStatus,
  };
}

function toInput(values: EmployeeFormValues): AdminEmployeeInput {
  return {
    employeeCode: values.employeeCode,
    teamId: values.teamId,
    managerEmployeeId: values.managerEmployeeId === NONE_MANAGER ? null : values.managerEmployeeId,
    roleId: values.roleId,
    positionTitle: values.positionTitle || null,
    levelName: values.levelName || null,
    accountStatus: values.accountStatus,
  };
}

export function EmployeeEditModal({
  employee,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  options,
}: EmployeeEditModalProps) {
  const { t } = useLocale();
  const managerOptions = useMemo(
    () => [
      { id: NONE_MANAGER, name: t("admin.noManager") },
      ...options.managers.filter((manager) => manager.id !== employee.id),
    ],
    [employee.id, options.managers, t],
  );
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: toFormValues(employee),
  });

  return (
    <AppModal
      isOpen
      classNames={{ base: "max-h-[92dvh] rounded-xl border border-line/85 bg-panel shadow-lift" }}
      size="3xl"
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <ModalContent>
        <form onSubmit={form.handleSubmit((values) => onSubmit(toInput(values)))}>
          <ModalHeader className="flex items-start gap-3 border-b border-line/85 px-5 py-4 pr-16">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
              <BriefcaseBusiness aria-hidden size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold leading-6 text-ink">{t("employees.editEmployee")}</span>
              <span className="block truncate text-xs font-normal leading-5 text-muted">{employee.email}</span>
            </span>
          </ModalHeader>
          <ModalBody className="max-h-[calc(92dvh-9rem)] overflow-y-auto bg-slate-50/70 px-5 py-5 dark:bg-white/[0.03]">
            <div className="grid gap-4 md:grid-cols-2">
              <ControlledTextField isRequired control={form.control} label={t("admin.officialCode")} name="employeeCode" />
              <ControlledSelectField
                isRequired
                ariaLabel={t("admin.team")}
                control={form.control}
                label={t("admin.team")}
                name="teamId"
                options={options.teams}
                placeholder={t("admin.selectTeam")}
              />
              <ControlledSelectField
                isRequired
                ariaLabel={t("admin.role")}
                control={form.control}
                label={t("admin.role")}
                name="roleId"
                options={options.roles}
                placeholder={t("admin.selectRole")}
              />
              <ControlledSelectField
                ariaLabel={t("admin.manager")}
                control={form.control}
                label={t("admin.manager")}
                name="managerEmployeeId"
                options={managerOptions}
                placeholder={t("admin.selectManager")}
              />
              <ControlledTextField control={form.control} label={t("admin.position")} name="positionTitle" />
              <ControlledTextField control={form.control} label={t("admin.level")} name="levelName" />
              <ControlledSelectField
                isRequired
                ariaLabel={t("employees.status")}
                control={form.control}
                label={t("employees.status")}
                name="accountStatus"
                options={[
                  { id: "active", name: t("employees.active") },
                  { id: "disabled", name: t("employees.disabled") },
                  { id: "terminated", name: t("employees.terminated") },
                ]}
                placeholder={t("employees.status")}
              />
            </div>
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line/85 bg-panel px-5 py-4">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>
              {t("admin.cancel")}
            </ActionButton>
            <ActionButton
              color="primary"
              isLoading={isSubmitting}
              startContent={<Save aria-hidden size={16} />}
              type="submit"
            >
              {t("employees.saveEmployee")}
            </ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
