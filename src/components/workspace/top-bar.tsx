"use client";

import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";

import { LocaleSwitcher } from "../locale-switcher";
import { ThemeToggle } from "../theme-toggle";
import { IconButton } from "./icon-button";
import { UserMenu } from "./user-menu";

type TopBarProps = {
  onOpenMenu: () => void;
};

export function TopBar({ onOpenMenu }: TopBarProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const pageTitle = pathname.startsWith("/admin") ? t("nav.admin") : t("nav.overview");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-panel px-4 md:px-6 lg:px-8">
      <span className="lg:hidden">
        <IconButton icon={Menu} label={t("header.openMenu")} onPress={onOpenMenu} />
      </span>
      <Breadcrumbs
        className="hidden md:flex"
        classNames={{
          list: "gap-2",
          separator: "px-0 text-muted",
        }}
        separator="/"
      >
        <BreadcrumbItem className="text-sm text-muted">{t("header.breadcrumbWorkspace")}</BreadcrumbItem>
        <BreadcrumbItem className="text-sm font-medium text-ink">{pageTitle}</BreadcrumbItem>
      </Breadcrumbs>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <span className="hidden sm:inline-flex">
          <IconButton icon={Bell} label={t("header.notifications")} />
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
