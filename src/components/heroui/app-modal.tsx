"use client";

import { Button, Modal, type ModalProps } from "@heroui/react";
import { X } from "lucide-react";

const defaultCloseButton = (
  <Button
    isIconOnly
    aria-label="Close"
    className="h-9 w-9 min-w-9 rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors data-[hover=true]:border-primary/45 data-[hover=true]:bg-primary/5 data-[hover=true]:text-ink"
    radius="lg"
    type="button"
    variant="flat"
  >
    <X aria-hidden size={18} strokeWidth={2} />
  </Button>
);

const modalClassNames = {
  backdrop: "z-[80] bg-slate-950/58 backdrop-blur-[2px]",
  base: "overflow-hidden rounded-xl border border-line/90 bg-panel text-ink shadow-lift",
  closeButton:
    "absolute right-4 top-4 z-20 h-9 w-9 min-w-9 rounded-lg border border-line bg-panel text-muted shadow-sm transition-colors hover:border-primary/45 hover:bg-primary/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
  wrapper: "z-[90] px-3 py-5 sm:px-6",
} as const;

export function AppModal({ classNames, closeButton = defaultCloseButton, ...props }: ModalProps) {
  return (
    <Modal
      {...props}
      backdrop="opaque"
      classNames={{ ...modalClassNames, ...classNames }}
      closeButton={closeButton}
      placement="center"
      radius="lg"
    />
  );
}
