"use client";

import { addToast } from "@heroui/react";

export function showSuccessToast(title: string) {
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
