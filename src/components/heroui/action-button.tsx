"use client";

import { Button, type ButtonProps } from "@heroui/react";

export function ActionButton({ className, color, radius = "lg", variant, ...props }: ButtonProps) {
  const isPrimary = color === "primary" && (!variant || variant === "solid");
  const classes = [
    "cursor-pointer font-semibold transition-all duration-200 ease-out data-[hover=true]:-translate-y-0.5 data-[pressed=true]:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    isPrimary
      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-button data-[hover=true]:shadow-lift"
      : "shadow-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Button {...props} className={classes} color={color} radius={radius} variant={variant} />;
}
