"use client";

import { useState } from "react";

import { SidebarNav } from "./workspace/sidebar-nav";
import { TopBar } from "./workspace/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="mx-auto grid min-h-[100dvh] max-w-full lg:grid-cols-[248px_minmax(0,1fr)]">
        <SidebarNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <div className="min-w-0 overflow-x-hidden">
          <TopBar onOpenMenu={() => setMobileMenuOpen(true)} />

          <main className="min-h-[calc(100dvh-3.5rem)] p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
