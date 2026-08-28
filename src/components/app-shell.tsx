"use client";

import { useState } from "react";

import { SidebarNav } from "./workspace/sidebar-nav";
import { TopBar } from "./workspace/top-bar";

export function AppShell({
  children,
  canAccessAdmin,
}: {
  children: React.ReactNode;
  canAccessAdmin: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="grid min-h-[100dvh] lg:grid-cols-[264px_minmax(0,1fr)]">
        <SidebarNav canAccessAdmin={canAccessAdmin} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <div className="min-w-0 overflow-x-hidden">
          <TopBar onOpenMenu={() => setMobileMenuOpen(true)} />

          <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1480px] p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
