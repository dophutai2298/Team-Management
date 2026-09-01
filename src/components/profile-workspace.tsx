"use client";

import { Avatar, Chip, Divider, Skeleton } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiClientError, fetchApi } from "@/lib/api/client";
import type { EmployeeProfile, EmployeeProfileInput } from "@/lib/employee/profile";
import { useLocale } from "@/lib/i18n/locale-provider";

import { ActionButton } from "./heroui/action-button";
import { showSuccessToast } from "./heroui/app-toast";
import { ControlledSelectField, ControlledTextField } from "./heroui/controlled-fields";
import { FormError } from "./heroui/form-error";
import { EmptyPanel } from "./workspace/empty-panel";
import { PageHeader } from "./workspace/page-header";
import { WorkspacePanel } from "./workspace/workspace-panel";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter at least 2 characters.").max(160, "Keep this under 160 characters."),
  birthday: z.string().trim().optional(),
  phone: z.string().trim().max(40, "Keep this under 40 characters.").optional(),
  address: z.string().trim().max(240, "Keep this under 240 characters.").optional(),
  hometown: z.string().trim().max(120, "Keep this under 120 characters.").optional(),
  avatarUrl: z.string().trim().max(500, "Keep this under 500 characters.").optional(),
  timezone: z.string().trim().min(2, "Enter a timezone.").max(80, "Keep this under 80 characters."),
  locale: z.enum(["vi", "en"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function toFormValues(profile: EmployeeProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    birthday: profile.birthday ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    hometown: profile.hometown ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    timezone: profile.timezone,
    locale: profile.locale,
  };
}

function toInput(values: ProfileFormValues): EmployeeProfileInput {
  return {
    fullName: values.fullName,
    birthday: values.birthday || null,
    phone: values.phone || null,
    address: values.address || null,
    hometown: values.hometown || null,
    avatarUrl: values.avatarUrl || null,
    timezone: values.timezone,
    locale: values.locale,
  };
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "We could not save your profile. Please try again.";
}

export function ProfileWorkspace() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile", "self"],
    queryFn: () => fetchApi<{ profile: EmployeeProfile }>("/api/profile"),
  });
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      birthday: "",
      phone: "",
      address: "",
      hometown: "",
      avatarUrl: "",
      timezone: "Asia/Saigon",
      locale: "vi",
    },
  });
  const saveMutation = useMutation({
    mutationFn: (input: EmployeeProfileInput) =>
      fetchApi<{ id: string }>("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", "self"] });
      showSuccessToast(t("profile.toastSaved"));
    },
  });
  const profile = profileQuery.data?.profile;

  useEffect(() => {
    if (profile) {
      form.reset(toFormValues(profile));
    }
  }, [form, profile]);

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <PageHeader
        actions={
          profile ? (
            <Chip className="h-8 px-2.5 text-xs font-semibold capitalize" color="success" radius="sm" variant="flat">
              {profile.accountStatus.replace("_", " ")}
            </Chip>
          ) : null
        }
        description={t("profile.description")}
        eyebrow={t("profile.eyebrow")}
        title={t("profile.title")}
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <WorkspacePanel id="profile-form-title" title={t("profile.personalTitle")} description={t("profile.personalDescription")}>
          {profileQuery.isPending ? <ProfileSkeleton /> : null}
          {profileQuery.isError ? (
            <EmptyPanel
              action={
                <ActionButton
                  color="primary"
                  size="sm"
                  startContent={<RefreshCw aria-hidden size={15} />}
                  onPress={() => void profileQuery.refetch()}
                >
                  {t("admin.retry")}
                </ActionButton>
              }
              description={getErrorMessage(profileQuery.error)}
              icon={AlertCircle}
              title={t("profile.loadError")}
            />
          ) : null}
          {profile ? (
            <form className="space-y-5" onSubmit={form.handleSubmit((values) => saveMutation.mutate(toInput(values)))}>
              <div className="grid gap-4 md:grid-cols-2">
                <ControlledTextField isRequired control={form.control} label={t("auth.fullName")} name="fullName" />
                <ControlledTextField control={form.control} label={t("profile.birthday")} name="birthday" type="date" />
                <ControlledTextField control={form.control} label={t("profile.phone")} name="phone" />
                <ControlledTextField isRequired control={form.control} label={t("profile.timezone")} name="timezone" />
                <ControlledTextField control={form.control} label={t("profile.hometown")} name="hometown" />
                <ControlledSelectField
                  ariaLabel={t("header.language")}
                  control={form.control}
                  label={t("header.language")}
                  name="locale"
                  options={[
                    { id: "vi", name: "Tieng Viet" },
                    { id: "en", name: "English" },
                  ]}
                  placeholder={t("header.language")}
                />
                <div className="md:col-span-2">
                  <ControlledTextField control={form.control} label={t("profile.address")} name="address" />
                </div>
                <div className="md:col-span-2">
                  <ControlledTextField control={form.control} label={t("profile.avatarUrl")} name="avatarUrl" />
                </div>
              </div>
              {saveMutation.isError ? <FormError>{getErrorMessage(saveMutation.error)}</FormError> : null}
              <div className="flex justify-end">
                <ActionButton
                  color="primary"
                  isLoading={saveMutation.isPending}
                  startContent={<Save aria-hidden size={16} />}
                  type="submit"
                >
                  {t("profile.save")}
                </ActionButton>
              </div>
            </form>
          ) : null}
        </WorkspacePanel>

        <WorkspacePanel id="profile-official-title" title={t("profile.officialTitle")} description={t("profile.officialDescription")}>
          {profile ? (
            <div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-primary text-primary-foreground" name={profile.fullName} src={profile.avatarUrl ?? undefined} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{profile.fullName}</p>
                  <p className="truncate text-xs text-muted">{profile.email}</p>
                </div>
              </div>
              <Divider className="my-4 bg-line" />
              <dl className="space-y-3 text-sm">
                {[
                  [t("admin.officialCode"), profile.employeeCode ?? "-"],
                  [t("admin.team"), profile.teamName ?? "-"],
                  [t("admin.manager"), profile.managerName ?? "-"],
                  [t("admin.role"), profile.roleName ?? "-"],
                  [t("admin.position"), profile.positionTitle ?? "-"],
                  [t("admin.level"), profile.levelName ?? "-"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                    <dt className="text-xs font-medium text-muted">{label}</dt>
                    <dd className="min-w-0 truncate text-sm font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <ProfileSkeleton />
          )}
        </WorkspacePanel>
      </div>
    </div>
  );
}
