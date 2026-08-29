"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Check, Languages } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/messages";

const localeLabels: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Dropdown
      classNames={{
        base: "z-[70]",
        content: "min-w-[128px] rounded-lg border border-line/85 !bg-white p-1.5 text-ink shadow-lift backdrop-blur-none dark:!bg-slate-900",
      }}
      placement="bottom-end"
    >
      <DropdownTrigger>
        <Button
          aria-label={t("header.language")}
          className="relative z-20 h-9 min-w-16 border border-line !bg-panel px-2.5 font-semibold text-ink shadow-sm transition-all duration-200 data-[hover=true]:-translate-y-0.5 data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5"
          radius="lg"
          startContent={<Languages aria-hidden size={16} />}
          variant="flat"
        >
          {locale.toUpperCase()}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t("header.language")}
        classNames={{ base: "!bg-white text-ink dark:!bg-slate-900" }}
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onAction={(key) => setLocale(key as Locale)}
      >
        {(Object.entries(localeLabels) as [Locale, string][]).map(([key, label]) => (
          <DropdownItem
            key={key}
            className="min-h-8 text-ink opacity-100 data-[hover=true]:bg-primary/5 data-[selected=true]:bg-primary/10"
            classNames={{
              title: "text-sm font-semibold text-ink group-data-[selected=true]:text-primary",
            }}
            endContent={locale === key ? <Check aria-hidden size={16} /> : null}
          >
            {label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
