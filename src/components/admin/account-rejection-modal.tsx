"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { UserRoundX } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { PendingAccount, RejectionInput } from "@/lib/admin/approval";
import { useLocale } from "@/lib/i18n/locale-provider";

import { ActionButton } from "../heroui/action-button";
import { AppModal } from "../heroui/app-modal";
import { ControlledTextareaField } from "../heroui/controlled-fields";
import { FormError } from "../heroui/form-error";

type AccountRejectionModalProps = {
  account: PendingAccount;
  error?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: RejectionInput) => void;
};

export function AccountRejectionModal({ account, error, isSubmitting, onClose, onSubmit }: AccountRejectionModalProps) {
  const { t } = useLocale();
  const schema = useMemo(
    () => z.object({ reason: z.string().trim().min(3, t("admin.errorInvalidRejection")).max(500, t("admin.errorInvalidRejection")) }),
    [t],
  );
  const { control, handleSubmit } = useForm<RejectionInput>({
    defaultValues: { reason: "" },
    resolver: zodResolver(schema),
  });

  return (
    <AppModal isOpen size="lg" onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}>
      <ModalContent>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader className="flex items-start gap-3 border-b border-line/85 px-5 py-5 sm:px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-danger/20 bg-danger/10 text-danger">
              <UserRoundX aria-hidden size={20} />
            </span>
            <span className="min-w-0 pr-8">
              <span className="block text-lg font-bold leading-6 text-ink">{t("admin.rejectTitle")}</span>
              <span className="mt-1 block truncate text-sm font-normal text-muted">
                {account.fullName} - {account.email}
              </span>
            </span>
          </ModalHeader>
          <ModalBody className="gap-5 bg-slate-50/70 px-5 py-6 dark:bg-white/[0.03] sm:px-6">
            <ControlledTextareaField
              isRequired
              control={control}
              label={t("admin.reason")}
              maxLength={500}
              name="reason"
              placeholder={t("admin.reasonPlaceholder")}
            />
            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          <ModalFooter className="border-t border-line/85 bg-panel px-5 py-4 sm:px-6">
            <ActionButton isDisabled={isSubmitting} variant="light" onPress={onClose}>
              {t("admin.cancel")}
            </ActionButton>
            <ActionButton color="primary" isLoading={isSubmitting} type="submit">
              {t("admin.reject")}
            </ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </AppModal>
  );
}
