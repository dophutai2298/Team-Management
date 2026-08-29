"use client";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";

export function UserMenu() {
  const router = useRouter();
  const { t } = useLocale();

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Dropdown
      classNames={{
        base: "z-[70]",
        content: "min-w-[180px] rounded-lg border border-line/85 !bg-white p-1.5 text-ink shadow-lift backdrop-blur-none dark:!bg-slate-900",
      }}
      placement="bottom-end"
    >
      <DropdownTrigger>
        <button
          aria-label={t("header.profile")}
          className="relative z-20 rounded-full border border-line bg-panel p-0.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          type="button"
        >
          <Avatar className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white" name="TA" />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label={t("header.profile")} classNames={{ base: "!bg-white text-ink dark:!bg-slate-900" }} variant="flat">
        <DropdownSection showDivider title={t("header.userName")}>
          <DropdownItem
            key="profile"
            className="min-h-8 text-ink data-[hover=true]:bg-primary/5"
            classNames={{ title: "text-sm font-semibold text-ink" }}
            href="/profile"
          >
            {t("profile.title")}
          </DropdownItem>
          <DropdownItem
            key="account"
            className="min-h-8 text-ink data-[hover=true]:bg-primary/5"
            classNames={{ title: "text-sm font-semibold text-ink" }}
            href="/account-status"
          >
            {t("header.accountStatus")}
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem key="sign-out" className="text-danger" color="danger" onPress={() => void signOut()}>
            {t("auth.signOut")}
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
