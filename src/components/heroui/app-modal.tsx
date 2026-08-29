"use client";

import { Button, Modal, type ModalProps } from "@heroui/react";
import { X } from "lucide-react";

const defaultCloseButton = (
  <Button isIconOnly aria-label="Close" radius="sm" type="button" variant="flat">
    <X aria-hidden size={18} strokeWidth={2} />
  </Button>
);

const modalClassNames = {
  backdrop: "z-[80] bg-black/55 backdrop-blur-[2px]",
  base: "overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-2xl",
  closeButton:
    "absolute right-4 top-4 z-20 h-9 w-9 min-w-9 rounded-md border border-line bg-canvas text-muted shadow-sm transition-colors hover:border-primary/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
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
