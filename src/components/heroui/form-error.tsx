import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-50 px-3.5 py-3 text-sm leading-6 text-danger dark:bg-danger-900/20"
      role="alert"
    >
      <AlertCircle aria-hidden className="mt-0.5 shrink-0" size={17} />
      <span>{children}</span>
    </div>
  );
}
