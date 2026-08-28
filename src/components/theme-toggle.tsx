"use client";

import { Button, Tooltip } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLocale();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? t("header.lightTheme") : t("header.darkTheme");

  return (
    <Tooltip content={label} delay={400}>
      <Button
        isIconOnly
        aria-label={label}
        className="h-9 w-9 min-w-9 border border-line bg-canvas text-ink shadow-sm"
        isDisabled={!mounted}
        radius="lg"
        variant="flat"
        onPress={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun aria-hidden size={17} /> : <Moon aria-hidden size={17} />}
      </Button>
    </Tooltip>
  );
}
