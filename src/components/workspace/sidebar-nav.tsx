"use client";

import { Chip } from "@heroui/react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckSquare2,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  Timer,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { IconButton } from "./icon-button";

const navigation = [
  { key: "nav.overview", href: "/dashboard", icon: LayoutDashboard, available: true },
  { key: "nav.organization", href: "/organization", icon: Building2, available: false },
  { key: "nav.employees", href: "/employees", icon: Users, available: true, requiresAdmin: true },
  { key: "nav.tasks", href: "/tasks", icon: CheckSquare2, available: false },
  { key: "nav.calendar", href: "/calendar", icon: CalendarDays, available: false },
  { key: "nav.notifications", href: "/notifications", icon: Bell, available: false },
  { key: "nav.todo", href: "/todo", icon: ListTodo, available: false },
  { key: "nav.focus", href: "/focus", icon: Timer, available: false },
  { key: "nav.admin", href: "/admin", icon: ShieldCheck, available: true, requiresAdmin: true, pinToBottom: true },
] as const;

type SidebarNavProps = {
  isOpen: boolean;
  onClose: () => void;
  canAccessAdmin: boolean;
};

export function SidebarNav({ canAccessAdmin, isOpen, onClose }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <>
      {isOpen ? (
        <button
          aria-label={t("header.closeMenu")}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          type="button"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[min(84vw,280px)] flex-col border-r border-line bg-panel px-3 py-4 transition-transform duration-150 lg:sticky lg:top-0 lg:h-[100dvh] lg:w-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-line px-2 pb-3">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/dashboard"
            onClick={onClose}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              TM
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5 text-ink">{t("app.name")}</span>
              <span className="block truncate text-xs leading-4 text-muted">{t("app.workspace")}</span>
            </span>
          </Link>
          <span className="lg:hidden">
            <IconButton icon={X} label={t("header.closeMenu")} className="border-0" onPress={onClose} />
          </span>
        </div>

        <nav aria-label={t("nav.primary")} className="mt-5 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {navigation.map(({ key, href, icon: Icon, available, ...item }) => {
            const isAvailable = available && (!("requiresAdmin" in item) || !item.requiresAdmin || canAccessAdmin);
            const isActive = isAvailable && pathname === href;
            const pinToBottom = "pinToBottom" in item && item.pinToBottom;
            const content = (
              <>
                <Icon aria-hidden size={17} strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate">{t(key as MessageKey)}</span>
                {!isAvailable ? (
                  <Chip className="h-5 bg-canvas px-1 text-[10px] text-muted" radius="sm" size="sm">
                    {t("nav.soon")}
                  </Chip>
                ) : null}
              </>
            );

            if (!isAvailable) {
              return (
                <div
                  key={href}
                  aria-disabled="true"
                  className={`flex h-10 shrink-0 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-muted opacity-70 ${
                    pinToBottom ? "mt-auto border-t border-line pt-4" : ""
                  }`}
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:bg-canvas hover:text-ink"
                }`}
                href={href}
                onClick={onClose}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
