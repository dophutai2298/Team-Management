"use client";

import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowDownUp, Check, RefreshCw, ShieldCheck, UserRoundX } from "lucide-react";
import { useMemo, useState } from "react";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import type { ApprovalInput, ApprovalOptions, PendingAccount } from "@/lib/admin/approval";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { selectFieldClassNames, textareaFieldClassNames } from "./ui/form-field-styles";
import { FormError } from "./ui/form-error";
import { TextField } from "./ui/text-field";
import { EmptyPanel } from "./workspace/empty-panel";
import { PageHeader } from "./workspace/page-header";
import { WorkspacePanel } from "./workspace/workspace-panel";

type ApprovalForm = ApprovalInput;

const emptyApprovalForm: ApprovalForm = {
  employeeCode: "",
  teamId: "",
  managerEmployeeId: null,
  roleId: "",
  positionTitle: "",
  levelName: "",
};

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

const adminModalClassNames = {
  backdrop: "z-[80] bg-black/45",
  base: "overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-2xl",
  closeButton: "z-10 text-muted hover:bg-canvas hover:text-ink",
  wrapper: "z-[90]",
};

function getErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
  return error instanceof ApiClientError ? t(errorMessageKeys[error.code] ?? "admin.errorGeneric") : t("admin.errorGeneric");
}

function QueueSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

function SortButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      className="h-7 min-w-0 justify-start gap-1 px-1 text-xs font-semibold text-muted"
      endContent={<ArrowDownUp aria-hidden size={12} />}
      radius="lg"
      size="sm"
      variant="light"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

export function AdminApprovalWorkspace() {
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([{ id: "requestedAt", desc: false }]);
  const [approvalTarget, setApprovalTarget] = useState<PendingAccount | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<PendingAccount | null>(null);
  const [approvalForm, setApprovalForm] = useState<ApprovalForm>(emptyApprovalForm);
  const [rejectionReason, setRejectionReason] = useState("");

  const accountsQuery = useQuery({
    queryKey: ["admin", "pending-accounts"],
    queryFn: () => fetchApi<{ accounts: PendingAccount[] }>("/api/admin/pending-accounts"),
  });
  const optionsQuery = useQuery({
    queryKey: ["admin", "approval-options"],
    queryFn: () => fetchApi<ApprovalOptions>("/api/admin/approval-options"),
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!approvalTarget) throw new Error("Choose a pending account first.");

      return fetchApi<{ id: string }>(`/api/admin/pending-accounts/${approvalTarget.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalForm),
      });
    },
    onSuccess: async () => {
      setApprovalTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "pending-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "approval-options"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!rejectionTarget) throw new Error("Choose a pending account first.");

      return fetchApi<{ id: string }>(`/api/admin/pending-accounts/${rejectionTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
    },
    onSuccess: async () => {
      setRejectionTarget(null);
      setRejectionReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "pending-accounts"] });
    },
  });

  const columns = useMemo<ColumnDef<PendingAccount>[]>(
    () => [
      { accessorKey: "fullName" },
      { accessorKey: "employeeCodeClaim" },
      { accessorKey: "requestedAt" },
    ],
    [],
  );
  // TanStack Table intentionally exposes mutable table helpers; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: accountsQuery.data?.accounts ?? [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });
  const approvalOptions = optionsQuery.data;
  const hasOrganizationOptions = Boolean(approvalOptions?.teams.length && approvalOptions.roles.length);

  const openApproval = (account: PendingAccount) => {
    setApprovalForm({
      ...emptyApprovalForm,
      employeeCode: account.employeeCodeClaim,
      roleId: approvalOptions?.roles.find((role) => role.name === "Employee")?.id ?? "",
    });
    setApprovalTarget(account);
    approveMutation.reset();
  };

  const openRejection = (account: PendingAccount) => {
    setRejectionReason("");
    setRejectionTarget(account);
    rejectMutation.reset();
  };

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.title")}
        description={t("admin.description")}
        actions={
          <Chip className="h-8 px-2.5 text-xs font-medium" color="warning" radius="full" variant="flat">
            {accountsQuery.data?.accounts.length ?? 0} {t("admin.pendingCount")}
          </Chip>
        }
      />

      <section className="mt-7" aria-labelledby="pending-accounts-title">
        <WorkspacePanel
          action={
            accountsQuery.isError ? (
              <Button
                color="danger"
                isLoading={accountsQuery.isFetching}
                radius="lg"
                size="sm"
                startContent={<RefreshCw aria-hidden size={15} />}
                variant="flat"
                onPress={() => void accountsQuery.refetch()}
              >
                {t("admin.retry")}
              </Button>
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
                <Button color="primary" radius="lg" size="sm" onPress={() => void accountsQuery.refetch()}>
                  {t("admin.retry")}
                </Button>
              }
              description={getErrorMessage(accountsQuery.error, t)}
              icon={AlertCircle}
              title={t("admin.loadError")}
            />
          ) : null}
          {!accountsQuery.isPending && !accountsQuery.isError && table.getRowModel().rows.length === 0 ? (
            <EmptyPanel
              description={t("admin.emptyDescription")}
              icon={ShieldCheck}
              title={t("admin.emptyTitle")}
            />
          ) : null}
          {!accountsQuery.isPending && !accountsQuery.isError && table.getRowModel().rows.length > 0 ? (
            <div className="-mx-5 overflow-x-auto md:-mx-6">
              <Table
                removeWrapper
                aria-label={t("admin.pendingTitle")}
                className="min-w-[720px]"
                classNames={{
                  th: "border-b border-line bg-canvas px-3 py-2.5 first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6",
                  td: "border-b border-line px-3 py-4 align-middle first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6",
                  tr: "last:border-b-0 data-[hover=true]:bg-canvas",
                }}
              >
              <TableHeader>
                <TableColumn>
                  <SortButton label={t("admin.account")} onPress={() => table.getColumn("fullName")?.toggleSorting()} />
                </TableColumn>
                <TableColumn>
                  <SortButton label={t("admin.claimedCode")} onPress={() => table.getColumn("employeeCodeClaim")?.toggleSorting()} />
                </TableColumn>
                <TableColumn>
                  <SortButton label={t("admin.requestedAt")} onPress={() => table.getColumn("requestedAt")?.toggleSorting()} />
                </TableColumn>
                <TableColumn>{t("admin.actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => {
                  const account = row.original;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-ink">{account.fullName}</p>
                        <p className="mt-0.5 text-xs text-muted">{account.email}</p>
                      </TableCell>
                      <TableCell>
                        <Chip className="h-6 px-2 font-mono text-[11px]" radius="sm" size="sm" variant="flat">
                          {account.employeeCodeClaim}
                        </Chip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted">
                        {dateFormatter.format(new Date(account.requestedAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            className="h-8 px-3 text-xs font-medium"
                            color="danger"
                            radius="lg"
                            size="sm"
                            startContent={<UserRoundX aria-hidden size={14} />}
                            variant="flat"
                            onPress={() => openRejection(account)}
                          >
                            {t("admin.reject")}
                          </Button>
                          <Button
                            className="h-8 px-3 text-xs font-medium"
                            color="primary"
                            radius="lg"
                            size="sm"
                            startContent={<Check aria-hidden size={14} />}
                            onPress={() => openApproval(account)}
                          >
                            {t("admin.approve")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          ) : null}
        </WorkspacePanel>
      </section>

      <Modal
        backdrop="opaque"
        classNames={adminModalClassNames}
        isOpen={approvalTarget !== null}
        radius="lg"
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={(isOpen) => !isOpen && !approveMutation.isPending && setApprovalTarget(null)}
      >
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                approveMutation.mutate();
              }}
            >
              <ModalHeader className="flex-col items-start gap-1 border-b border-line px-6 py-5">
                <span className="text-lg font-semibold leading-7">{t("admin.approveTitle")}</span>
                <span className="text-sm font-normal leading-6 text-muted">{approvalTarget?.fullName}</span>
              </ModalHeader>
              <ModalBody className="gap-5 px-6 py-6">
                {optionsQuery.isPending ? <QueueSkeleton /> : null}
                {optionsQuery.isError ? (
                  <FormError>{getErrorMessage(optionsQuery.error, t)}</FormError>
                ) : null}
                {!optionsQuery.isPending && !optionsQuery.isError ? (
                  <>
                    {!hasOrganizationOptions ? (
                      <p className="rounded-lg border border-warning/30 bg-warning-50 px-3 py-2.5 text-sm leading-6 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300">
                        {t("admin.missingOptions")}
                      </p>
                    ) : null}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        isRequired
                        label={t("admin.officialCode")}
                        value={approvalForm.employeeCode}
                        onValueChange={(employeeCode) => setApprovalForm((form) => ({ ...form, employeeCode }))}
                      />
                      <Select
                        isRequired
                        aria-label={t("admin.team")}
                        classNames={selectFieldClassNames}
                        label={t("admin.team")}
                        labelPlacement="outside"
                        placeholder={t("admin.selectTeam")}
                        selectedKeys={approvalForm.teamId ? [approvalForm.teamId] : []}
                        radius="lg"
                        variant="bordered"
                        onChange={(event) => setApprovalForm((form) => ({ ...form, teamId: event.target.value }))}
                      >
                        {(approvalOptions?.teams ?? []).map((team) => (
                          <SelectItem key={team.id} textValue={team.name}>
                            {team.name}{team.detail ? ` (${team.detail})` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                      <Select
                        isRequired
                        aria-label={t("admin.role")}
                        classNames={selectFieldClassNames}
                        label={t("admin.role")}
                        labelPlacement="outside"
                        placeholder={t("admin.selectRole")}
                        selectedKeys={approvalForm.roleId ? [approvalForm.roleId] : []}
                        radius="lg"
                        variant="bordered"
                        onChange={(event) => setApprovalForm((form) => ({ ...form, roleId: event.target.value }))}
                      >
                        {(approvalOptions?.roles ?? []).map((role) => (
                          <SelectItem key={role.id}>{role.name}</SelectItem>
                        ))}
                      </Select>
                      <Select
                        aria-label={t("admin.manager")}
                        classNames={selectFieldClassNames}
                        label={t("admin.manager")}
                        labelPlacement="outside"
                        placeholder={t("admin.noManager")}
                        selectedKeys={approvalForm.managerEmployeeId ? [approvalForm.managerEmployeeId] : []}
                        radius="lg"
                        variant="bordered"
                        onChange={(event) =>
                          setApprovalForm((form) => ({ ...form, managerEmployeeId: event.target.value || null }))
                        }
                      >
                        {(approvalOptions?.managers ?? []).map((manager) => (
                          <SelectItem key={manager.id} textValue={manager.name}>
                            {manager.name}{manager.detail ? ` (${manager.detail})` : ""}
                          </SelectItem>
                        ))}
                      </Select>
                      <TextField
                        isRequired
                        label={t("admin.position")}
                        value={approvalForm.positionTitle}
                        onValueChange={(positionTitle) => setApprovalForm((form) => ({ ...form, positionTitle }))}
                      />
                      <TextField
                        isRequired
                        label={t("admin.level")}
                        value={approvalForm.levelName}
                        onValueChange={(levelName) => setApprovalForm((form) => ({ ...form, levelName }))}
                      />
                    </div>
                  </>
                ) : null}
                {approveMutation.isError ? (
                  <FormError>{getErrorMessage(approveMutation.error, t)}</FormError>
                ) : null}
              </ModalBody>
              <ModalFooter className="border-t border-line px-6 py-4">
                <Button radius="lg" variant="light" onPress={onClose}>
                  {t("admin.cancel")}
                </Button>
                <Button
                  color="primary"
                  isDisabled={!hasOrganizationOptions || optionsQuery.isPending}
                  isLoading={approveMutation.isPending}
                  radius="lg"
                  type="submit"
                >
                  {t("admin.approve")}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        backdrop="opaque"
        classNames={adminModalClassNames}
        isOpen={rejectionTarget !== null}
        radius="lg"
        onOpenChange={(isOpen) => !isOpen && !rejectMutation.isPending && setRejectionTarget(null)}
      >
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                rejectMutation.mutate();
              }}
            >
              <ModalHeader className="flex-col items-start gap-1 border-b border-line px-6 py-5">
                <span className="text-lg font-semibold leading-7">{t("admin.rejectTitle")}</span>
                <span className="text-sm font-normal leading-6 text-muted">{rejectionTarget?.fullName}</span>
              </ModalHeader>
              <ModalBody className="px-6 py-6">
                <Textarea
                  isRequired
                  classNames={textareaFieldClassNames}
                  label={t("admin.reason")}
                  labelPlacement="outside"
                  maxLength={500}
                  minRows={4}
                  placeholder={t("admin.reasonPlaceholder")}
                  value={rejectionReason}
                  radius="lg"
                  variant="bordered"
                  onValueChange={setRejectionReason}
                />
                {rejectMutation.isError ? (
                  <FormError>{getErrorMessage(rejectMutation.error, t)}</FormError>
                ) : null}
              </ModalBody>
              <ModalFooter className="border-t border-line px-6 py-4">
                <Button radius="lg" variant="light" onPress={onClose}>
                  {t("admin.cancel")}
                </Button>
                <Button color="danger" isLoading={rejectMutation.isPending} radius="lg" type="submit">
                  {t("admin.reject")}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
