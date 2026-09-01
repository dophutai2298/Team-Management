"use client";

import { addToast, getToastQueue } from "@heroui/react";

export function showSuccessToast(title: string) {
  getToastQueue();

  addToast({
    title,
    color: "success",
    radius: "sm",
    severity: "success",
    shouldShowTimeoutProgress: true,
    timeout: 3500,
    variant: "flat",
  });
}
