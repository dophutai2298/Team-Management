import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyPanelProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyPanel({ icon: Icon, title, description, action }: EmptyPanelProps) {
  return (
    <div className="flex min-h-64 flex-col justify-center border-t border-line py-8">
      <Icon aria-hidden className="text-primary" size={20} strokeWidth={1.9} />
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
