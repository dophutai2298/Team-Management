"use client";

import { Button, type ButtonProps } from "@heroui/react";

export function ActionButton({ className, radius = "lg", ...props }: ButtonProps) {
  const classes = [
    "font-semibold shadow-none transition-transform data-[pressed=true]:scale-[0.98]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Button {...props} className={classes} radius={radius} />;
}
