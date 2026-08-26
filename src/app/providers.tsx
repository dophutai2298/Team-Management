"use client";

import { HeroUIProvider } from "@heroui/react";
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
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
