"use client";

import { Button, Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  className?: string;
  isDisabled?: boolean;
  onPress?: () => void;
};

export function IconButton({
  icon: Icon,
  label,
  className,
  isDisabled,
  onPress,
}: IconButtonProps) {
  return (
    <Tooltip content={label} delay={400}>
      <Button
        isIconOnly
        aria-label={label}
        className={`h-9 w-9 min-w-9 rounded-lg border border-line bg-panel text-ink shadow-sm transition-all duration-200 data-[hover=true]:-translate-y-0.5 data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5 data-[pressed=true]:scale-[0.98] ${className ?? ""}`}
        isDisabled={isDisabled}
        radius="lg"
        variant="flat"
        onPress={onPress}
      >
        <Icon aria-hidden size={17} strokeWidth={1.8} />
      </Button>
    </Tooltip>
  );
}
