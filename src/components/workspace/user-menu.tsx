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
        content: "rounded-lg border border-line bg-panel text-ink shadow-panel",
      }}
      placement="bottom-end"
    >
      <DropdownTrigger>
        <button
          aria-label={t("header.profile")}
          className="relative z-20 rounded-full border border-line bg-canvas p-0.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          type="button"
        >
          <Avatar className="h-9 w-9 bg-primary text-xs text-primary-foreground" name="TA" />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label={t("header.profile")} variant="flat">
        <DropdownSection showDivider title={t("header.userName")}>
          <DropdownItem key="account" href="/account-status">
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
