"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton } from "@heroui/react";
import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ApprovalInput, ApprovalOptions, PendingAccount } from "@/lib/admin/approval";
import { useLocale } from "@/lib/i18n/locale-provider";

import { ActionButton } from "../heroui/action-button";
import { AppModal } from "../heroui/app-modal";
import { ControlledSelectField, ControlledTextField } from "../heroui/controlled-fields";
import { FormError } from "../heroui/form-error";

type ApprovalValues = {
  employeeCode: string;
  levelName: string;
  managerEmployeeId: string;
  positionTitle: string;
  roleId: string;
  teamId: string;
};

type AccountApprovalModalProps = {
  account: PendingAccount;
  error?: string;
  isOptionsError: boolean;
  isOptionsLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: ApprovalInput) => void;
  options?: ApprovalOptions;
  optionsError?: string;
};

function ModalSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

export function AccountApprovalModal({
  account,
  error,
  isOptionsError,
  isOptionsLoading,
  isSubmitting,
  onClose,
  onSubmit,
  options,
  optionsError,
}: AccountApprovalModalProps) {
  const { t } = useLocale();
  const schema = useMemo(
    () =>
      z.object({
        employeeCode: z.string().trim().min(2, t("admin.errorInvalidApproval")).max(64, t("admin.errorInvalidApproval")),
        levelName: z.string().trim().max(120, t("admin.errorProfileFieldLength")),
        managerEmployeeId: z.string().min(1, t("validation.required")),
        positionTitle: z.string().trim().max(120, t("admin.errorProfileFieldLength")),
        roleId: z.string().min(1, t("validation.required")),
        teamId: z.string().min(1, t("validation.required")),
      }),
    [t],
  );
  const {
    control,
    formState: { isSubmitted, isValid },
    handleSubmit,
  } = useForm<ApprovalValues>({
    defaultValues: {
      employeeCode: account.employeeCodeClaim,
      levelName: "",
      managerEmployeeId: "",
      positionTitle: "",
      roleId: options?.roles.find((role) => role.name === "Employee")?.id ?? "",
      teamId: "",
    },
    resolver: zodResolver(schema),
  });
  const hasRequiredOptions = Boolean(options?.teams.length && options.roles.length && options.managers.length);

  return (
    <AppModal
      isOpen
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <ModalContent>
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            onSubmit({
              ...values,
              levelName: values.levelName || null,
              positionTitle: values.positionTitle || null,
            }),
          )}
        >
          <ModalHeader className="flex items-start gap-3 border-b border-line/85 px-5 py-5 sm:px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
              <ShieldCheck aria-hidden size={20} />
            </span>
            <span className="min-w-0 pr-8">
              <span className="block text-lg font-bold leading-6 text-ink">{t("admin.approveTitle")}</span>
              <span className="mt-1 block truncate text-sm font-normal text-muted">
                {account.fullName} - {account.email}
              </span>
            </span>
          </ModalHeader>
          <ModalBody className="gap-5 bg-slate-50/70 px-5 py-6 dark:bg-white/[0.03] sm:px-6">
            {isOptionsLoading ? <ModalSkeleton /> : null}
            {isOptionsError && optionsError ? <FormError>{optionsError}</FormError> : null}
            {!isOptionsLoading && !isOptionsError ? (
              <>
                {!hasRequiredOptions ? (
                  <div className="rounded-lg border border-warning/30 bg-warning-50 px-3.5 py-3 text-sm leading-6 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300">
                    {t("admin.missingOptions")}
                  </div>
                ) : null}
                <div className="grid gap-5 sm:grid-cols-2">
                  <ControlledTextField isRequired control={control} label={t("admin.officialCode")} name="employeeCode" />
                  <ControlledSelectField
                    isRequired
                    ariaLabel={t("admin.team")}
                    control={control}
                    label={t("admin.team")}
                    name="teamId"
                    options={options?.teams ?? []}
                    placeholder={t("admin.selectTeam")}
                  />
                  <ControlledSelectField
                    isRequired
                    ariaLabel={t("admin.role")}
                    control={control}
                    label={t("admin.role")}
                    name="roleId"
                    options={options?.roles ?? []}
                    placeholder={t("admin.selectRole")}
                  />
                  <ControlledSelectField
                    isRequired
                    ariaLabel={t("admin.manager")}
                    control={control}
                    label={t("admin.manager")}
                    name="managerEmployeeId"
                    options={options?.managers ?? []}
                    placeholder={t("admin.selectManager")}
                  />
                  <ControlledTextField control={control} label={t("admin.position")} name="positionTitle" />
                  <ControlledTextField control={control} label={t("admin.level")} name="levelName" />
                </div>
              </>
            ) : null}
            {isSubmitted && !isValid ? <FormError>{t("admin.errorReviewApproval")}</FormError> : null}
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line/85 bg-panel px-5 py-4 sm:px-6">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>
              {t("admin.cancel")}
            </ActionButton>
            <ActionButton
              color="primary"
              isDisabled={!hasRequiredOptions || isOptionsLoading}
              isLoading={isSubmitting}
              type="submit"
            >
              {t("admin.approve")}
            </ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
