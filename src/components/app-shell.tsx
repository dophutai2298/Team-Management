"use client";

import { Avatar, Button, Chip, Tooltip } from "@heroui/react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckSquare2,
  LayoutDashboard,
  ListTodo,
  Menu,
  Search,
  ShieldCheck,
  Timer,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { key: "nav.overview", href: "/dashboard", icon: LayoutDashboard, available: true },
  { key: "nav.organization", href: "/organization", icon: Building2, available: false },
  { key: "nav.employees", href: "/employees", icon: Users, available: false },
  { key: "nav.tasks", href: "/tasks", icon: CheckSquare2, available: false },
  { key: "nav.calendar", href: "/calendar", icon: CalendarDays, available: false },
  { key: "nav.notifications", href: "/notifications", icon: Bell, available: false },
  { key: "nav.todo", href: "/todo", icon: ListTodo, available: false },
  { key: "nav.focus", href: "/focus", icon: Timer, available: false },
  { key: "nav.admin", href: "/admin", icon: ShieldCheck, available: false, pinToBottom: true },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="mx-auto grid min-h-[100dvh] max-w-full lg:grid-cols-[248px_minmax(0,1fr)]">
        {mobileMenuOpen ? (
          <button
            aria-label={t("header.closeMenu")}
            className="fixed inset-0 z-40 bg-black/35 lg:hidden"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,280px)] flex-col border-r border-line bg-panel px-4 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-[100dvh] lg:w-auto lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-11 items-center justify-between px-2">
            <Link
              className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                TM
              </span>
              <span>
                <span className="block text-sm font-semibold leading-5">{t("app.name")}</span>
                <span className="block text-xs leading-4 text-muted">{t("app.workspace")}</span>
              </span>
            </Link>
            <Button
              isIconOnly
              aria-label={t("header.closeMenu")}
              className="h-9 w-9 min-w-9 text-muted lg:hidden"
              radius="sm"
              variant="light"
              onPress={() => setMobileMenuOpen(false)}
            >
              <X aria-hidden size={18} />
            </Button>
          </div>

          <nav aria-label={t("nav.primary")} className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {navigation.map(({ key, href, icon: Icon, available, ...item }) => {
              const active = available && pathname === href;
              const pinToBottom = "pinToBottom" in item && item.pinToBottom;
              const content = (
                <>
                  <Icon aria-hidden size={18} strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate">{t(key as MessageKey)}</span>
                  {!available ? (
                    <Chip className="h-5 bg-default-100 px-1 text-[10px] text-muted" radius="sm" size="sm">
                      {t("nav.soon")}
                    </Chip>
                  ) : null}
                </>
              );

              if (!available) {
                return (
                  <div
                    key={href}
                    aria-disabled="true"
                    className={`flex h-10 shrink-0 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-muted opacity-70 ${
                      pinToBottom ? "mt-auto border-t border-line" : ""
                    }`}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-default-100 hover:text-ink"
                  }`}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
          </nav>

        </aside>

        <div className="min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-panel/95 px-4 backdrop-blur-md md:px-6">
            <Button
              isIconOnly
              aria-label={t("header.openMenu")}
              className="h-9 w-9 min-w-9 border border-line bg-panel text-ink lg:hidden"
              radius="sm"
              variant="flat"
              onPress={() => setMobileMenuOpen(true)}
            >
              <Menu aria-hidden size={18} />
            </Button>

            <button
              className="hidden h-9 min-w-0 max-w-sm flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-left text-sm text-muted transition-colors hover:border-default-400 md:flex"
              type="button"
            >
              <Search aria-hidden size={16} />
              <span className="truncate">{t("header.search")}</span>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <span className="hidden sm:inline-flex">
                <Tooltip content={t("header.notifications")} delay={400}>
                  <Button
                    isIconOnly
                    aria-label={t("header.notifications")}
                    className="h-9 w-9 min-w-9 border border-line bg-panel text-ink"
                    radius="sm"
                    variant="flat"
                  >
                    <Bell aria-hidden size={17} />
                  </Button>
                </Tooltip>
              </span>
              <span className="ml-1 hidden sm:inline-flex">
                <Tooltip content={t("header.profile")} delay={400}>
                  <button
                    aria-label={t("header.profile")}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    type="button"
                  >
                    <Avatar className="h-9 w-9 bg-primary text-xs text-primary-foreground" name="TA" />
                  </button>
                </Tooltip>
              </span>
            </div>
          </header>

          <main className="min-h-[calc(100dvh-4rem)] p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
