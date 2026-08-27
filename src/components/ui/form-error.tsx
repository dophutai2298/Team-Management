import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="rounded-lg border border-danger/30 bg-danger-50 px-3 py-2 text-sm leading-6 text-danger dark:bg-danger-900/20"
    >
      {children}
    </p>
  );
}
