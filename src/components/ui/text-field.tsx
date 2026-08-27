"use client";

import { Input, type InputProps } from "@heroui/react";

type TextFieldProps = InputProps;

const classNames = {
  base: "gap-1.5",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "h-11 min-h-11 rounded-sm border border-line bg-canvas px-3 shadow-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/50 data-[hover=true]:bg-panel data-[focus=true]:border-primary data-[focus=true]:bg-panel data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] [&:has(input:focus)]:border-primary [&:has(input:focus)]:bg-panel [&:has(input:focus)]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.1)] dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)] dark:[&:has(input:focus)]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)]",
  input: "text-sm text-ink outline-none focus:outline-none placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export function TextField({ classNames: userClassNames, type, ...props }: TextFieldProps) {
  return (
    <Input
      {...props}
      classNames={{ ...classNames, ...userClassNames }}
      color="primary"
      labelPlacement="outside-top"
      radius="sm"
      type={type}
      variant="bordered"
    />
  );
}
