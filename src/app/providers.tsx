"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";

import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={router.push}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="team-management-theme"
        >
          <ToastProvider
            maxVisibleToasts={4}
            placement="top-right"
            toastOffset={16}
            toastProps={{
              radius: "sm",
              shadow: "sm",
              shouldShowTimeoutProgress: true,
              timeout: 3500,
              variant: "flat",
              classNames: {
                base: "z-[1200] border border-line bg-panel text-ink shadow-lift",
                closeButton: "opacity-100",
                description: "text-muted",
                title: "font-semibold text-ink",
              },
            }}
          />
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
