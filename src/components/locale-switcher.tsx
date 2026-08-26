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
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          aria-label={t("header.language")}
          className="h-9 min-w-16 border border-line bg-panel px-2.5 text-ink"
          radius="sm"
          startContent={<Languages aria-hidden size={16} />}
          variant="flat"
        >
          {locale.toUpperCase()}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t("header.language")}
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onAction={(key) => setLocale(key as Locale)}
      >
        {(Object.entries(localeLabels) as [Locale, string][]).map(([key, label]) => (
          <DropdownItem
            key={key}
            endContent={locale === key ? <Check aria-hidden size={16} /> : null}
          >
            {label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
