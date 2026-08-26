"use client";

import { Button } from "@heroui/react";
import { CircleAlert, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-danger-50 text-danger dark:bg-danger-950/30">
          <CircleAlert aria-hidden size={23} />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-ink">{t("error.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{t("error.description")}</p>
        <Button
          className="mt-6"
          color="primary"
          radius="sm"
          startContent={<RefreshCw aria-hidden size={16} />}
          onPress={reset}
        >
          {t("error.retry")}
        </Button>
      </div>
    </div>
  );
}
