"use client";

import { Chip, Skeleton } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import type { AdminEmployeeInput, EmployeeManagementOptions, EmployeeSummary } from "@/lib/employee/profile";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { EmployeeEditModal } from "./admin/employee-edit-modal";
import { EmployeesTable } from "./data-table/employees-table";
import { ActionButton } from "./heroui/action-button";
import { showSuccessToast } from "./heroui/app-toast";
import { EmptyPanel } from "./workspace/empty-panel";
import { PageHeader } from "./workspace/page-header";
import { WorkspacePanel } from "./workspace/workspace-panel";

type EmployeesPayload = {
  employees: EmployeeSummary[];
  options: EmployeeManagementOptions;
};

type UpdateVariables = {
  employeeId: string;
  input: AdminEmployeeInput;
};

const errorMessageKeys: Partial<Record<string, MessageKey>> = {
  EMPLOYEE_CODE_IN_USE: "admin.errorEmployeeCodeInUse",
  EMPLOYEE_NOT_MANAGEABLE: "employees.errorNotManageable",
  EMPLOYEE_OPERATION_FAILED: "employees.errorGeneric",
  FORBIDDEN: "admin.errorForbidden",
  INVALID_EMPLOYEE_ID: "employees.errorInvalidEmployee",
  INVALID_EMPLOYEE_INPUT: "employees.errorInvalidInput",
  INVALID_EMPLOYEE_MANAGEMENT_INPUT: "employees.errorInvalidInput",
  INVALID_ORGANIZATION_ASSIGNMENT: "admin.errorInvalidOrganization",
  UNAUTHENTICATED: "admin.errorUnauthenticated",
};

function getErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
  return error instanceof ApiClientError
    ? t(errorMessageKeys[error.code] ?? "employees.errorGeneric")
    : t("employees.errorGeneric");
}

function EmployeesSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export function EmployeeManagementWorkspace() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<EmployeeSummary | null>(null);
  const employeesQuery = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: () => fetchApi<EmployeesPayload>("/api/admin/employees"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ employeeId, input }: UpdateVariables) =>
      fetchApi<{ id: string }>(`/api/admin/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setEditTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
      showSuccessToast(t("employees.toastUpdated"));
    },
  });
  const openEdit = useCallback(
    (employee: EmployeeSummary) => {
      updateMutation.reset();
      setEditTarget(employee);
    },
    [updateMutation],
  );
  const employees = employeesQuery.data?.employees ?? [];

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader
        actions={
          <Chip className="h-8 px-2.5 text-xs font-semibold" color="primary" radius="sm" variant="flat">
            {employees.length} {t("employees.count")}
          </Chip>
        }
        description={t("employees.description")}
        eyebrow={t("employees.eyebrow")}
        title={t("employees.title")}
      />

      <section className="mt-7" aria-labelledby="employees-table-title">
        <WorkspacePanel
          action={
            employeesQuery.isError ? (
              <ActionButton
                color="danger"
                isLoading={employeesQuery.isFetching}
                size="sm"
                startContent={<RefreshCw aria-hidden size={15} />}
                variant="flat"
                onPress={() => void employeesQuery.refetch()}
              >
                {t("admin.retry")}
              </ActionButton>
            ) : null
          }
          description={t("employees.tableDescription")}
          id="employees-table-title"
          title={t("employees.tableTitle")}
        >
          {employeesQuery.isPending ? <EmployeesSkeleton /> : null}
          {employeesQuery.isError ? (
            <EmptyPanel
              action={
                <ActionButton color="primary" size="sm" onPress={() => void employeesQuery.refetch()}>
                  {t("admin.retry")}
                </ActionButton>
              }
              description={getErrorMessage(employeesQuery.error, t)}
              icon={AlertCircle}
              title={t("employees.loadError")}
            />
          ) : null}
          {!employeesQuery.isPending && !employeesQuery.isError && employees.length === 0 ? (
            <EmptyPanel description={t("employees.emptyDescription")} icon={Users} title={t("employees.emptyTitle")} />
          ) : null}
          {!employeesQuery.isPending && !employeesQuery.isError && employees.length > 0 ? (
            <div className="-mx-5 -mb-5 md:-mx-6 md:-mb-6">
              <EmployeesTable employees={employees} onEdit={openEdit} />
            </div>
          ) : null}
        </WorkspacePanel>
      </section>

      {editTarget && employeesQuery.data ? (
        <EmployeeEditModal
          key={editTarget.id}
          employee={editTarget}
          error={updateMutation.isError ? getErrorMessage(updateMutation.error, t) : undefined}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditTarget(null)}
          onSubmit={(input) => updateMutation.mutate({ employeeId: editTarget.id, input })}
          options={employeesQuery.data.options}
        />
      ) : null}
    </div>
  );
}
