"use client";

import { Chip, Skeleton } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import type {
  ApprovalInput,
  ApprovalOptions,
  PendingAccount,
  RejectionInput,
} from "@/lib/admin/approval";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { AccountApprovalModal } from "./admin/account-approval-modal";
import { AccountRejectionModal } from "./admin/account-rejection-modal";
import { PendingAccountsTable } from "./data-table/pending-accounts-table";
import { ActionButton } from "./heroui/action-button";
import { showSuccessToast } from "./heroui/app-toast";
import { EmptyPanel } from "./workspace/empty-panel";
import { PageHeader } from "./workspace/page-header";
import { WorkspacePanel } from "./workspace/workspace-panel";

const errorMessageKeys: Partial<Record<string, MessageKey>> = {
  ACCOUNT_NOT_PENDING: "admin.errorAccountNotPending",
  ADMIN_OPERATION_FAILED: "admin.errorGeneric",
  EMPLOYEE_CODE_IN_USE: "admin.errorEmployeeCodeInUse",
  FORBIDDEN: "admin.errorForbidden",
  INVALID_ACCOUNT_ID: "admin.errorInvalidAccount",
  INVALID_APPROVAL_INPUT: "admin.errorInvalidApproval",
  INVALID_ORGANIZATION_ASSIGNMENT: "admin.errorInvalidOrganization",
  INVALID_REJECTION_INPUT: "admin.errorInvalidRejection",
  UNAUTHENTICATED: "admin.errorUnauthenticated",
};

function getErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
  return error instanceof ApiClientError
    ? t(errorMessageKeys[error.code] ?? "admin.errorGeneric")
    : t("admin.errorGeneric");
}

function QueueSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

type ApproveVariables = { accountId: string; input: ApprovalInput };
type RejectVariables = { accountId: string; input: RejectionInput };

export function AdminApprovalWorkspace() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [approvalTarget, setApprovalTarget] = useState<PendingAccount | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<PendingAccount | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["admin", "pending-accounts"],
    queryFn: () => fetchApi<{ accounts: PendingAccount[] }>("/api/admin/pending-accounts"),
  });
  const optionsQuery = useQuery({
    queryKey: ["admin", "approval-options"],
    queryFn: () => fetchApi<ApprovalOptions>("/api/admin/approval-options"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ accountId, input }: ApproveVariables) =>
      fetchApi<{ id: string }>(`/api/admin/pending-accounts/${accountId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setApprovalTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "pending-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "approval-options"] }),
      ]);
      showSuccessToast(t("admin.toastApproved"));
    },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ accountId, input }: RejectVariables) =>
      fetchApi<{ id: string }>(`/api/admin/pending-accounts/${accountId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setRejectionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "pending-accounts"] });
      showSuccessToast(t("admin.toastRejected"));
    },
  });

  const openApproval = useCallback((account: PendingAccount) => {
    approveMutation.reset();
    setApprovalTarget(account);
  }, [approveMutation]);
  const openRejection = useCallback((account: PendingAccount) => {
    rejectMutation.reset();
    setRejectionTarget(account);
  }, [rejectMutation]);
  const accounts = accountsQuery.data?.accounts ?? [];

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        actions={
          <Chip className="h-8 px-2.5 text-xs font-semibold" color="warning" radius="sm" variant="flat">
            {accounts.length} {t("admin.pendingCount")}
          </Chip>
        }
        description={t("admin.description")}
        eyebrow={t("admin.eyebrow")}
        title={t("admin.title")}
      />

      <section className="mt-7" aria-labelledby="pending-accounts-title">
        <WorkspacePanel
          action={
            accountsQuery.isError ? (
              <ActionButton
                color="danger"
                isLoading={accountsQuery.isFetching}
                size="sm"
                startContent={<RefreshCw aria-hidden size={15} />}
                variant="flat"
                onPress={() => void accountsQuery.refetch()}
              >
                {t("admin.retry")}
              </ActionButton>
            ) : null
          }
          description={t("admin.queueDescription")}
          id="pending-accounts-title"
          title={t("admin.pendingTitle")}
        >
          {accountsQuery.isPending ? <QueueSkeleton /> : null}
          {accountsQuery.isError ? (
            <EmptyPanel
              action={
                <ActionButton color="primary" size="sm" onPress={() => void accountsQuery.refetch()}>
                  {t("admin.retry")}
                </ActionButton>
              }
              description={getErrorMessage(accountsQuery.error, t)}
              icon={AlertCircle}
              title={t("admin.loadError")}
            />
          ) : null}
          {!accountsQuery.isPending && !accountsQuery.isError && accounts.length === 0 ? (
            <EmptyPanel description={t("admin.emptyDescription")} icon={ShieldCheck} title={t("admin.emptyTitle")} />
          ) : null}
          {!accountsQuery.isPending && !accountsQuery.isError && accounts.length > 0 ? (
            <div className="-mx-5 -mb-5 md:-mx-6 md:-mb-6">
              <PendingAccountsTable accounts={accounts} onApprove={openApproval} onReject={openRejection} />
            </div>
          ) : null}
        </WorkspacePanel>
      </section>

      {approvalTarget ? (
        <AccountApprovalModal
          key={approvalTarget.id}
          account={approvalTarget}
          error={approveMutation.isError ? getErrorMessage(approveMutation.error, t) : undefined}
          isOptionsError={optionsQuery.isError}
          isOptionsLoading={optionsQuery.isPending}
          isSubmitting={approveMutation.isPending}
          onClose={() => setApprovalTarget(null)}
          onSubmit={(input) => approveMutation.mutate({ accountId: approvalTarget.id, input })}
          options={optionsQuery.data}
          optionsError={optionsQuery.isError ? getErrorMessage(optionsQuery.error, t) : undefined}
        />
      ) : null}
      {rejectionTarget ? (
        <AccountRejectionModal
          key={rejectionTarget.id}
          account={rejectionTarget}
          error={rejectMutation.isError ? getErrorMessage(rejectMutation.error, t) : undefined}
          isSubmitting={rejectMutation.isPending}
          onClose={() => setRejectionTarget(null)}
          onSubmit={(input) => rejectMutation.mutate({ accountId: rejectionTarget.id, input })}
        />
      ) : null}
    </div>
  );
}
