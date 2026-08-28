"use client";

import { Modal, type ModalProps } from "@heroui/react";

const modalClassNames = {
  backdrop: "z-[80] bg-black/55 backdrop-blur-[2px]",
  base: "overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-2xl",
  closeButton: "z-10 right-4 top-4 text-muted hover:bg-canvas hover:text-ink",
  wrapper: "z-[90] px-3 py-5 sm:px-6",
} as const;

export function AppModal({ classNames, ...props }: ModalProps) {
  return (
    <Modal
      {...props}
      backdrop="opaque"
      classNames={{ ...modalClassNames, ...classNames }}
      placement="center"
      radius="lg"
    />
  );
}
