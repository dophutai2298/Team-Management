"use client";

import { Input, type InputProps } from "@heroui/react";

import { inputFieldClassNames } from "./field-styles";

export function TextField({ classNames: userClassNames, ...props }: InputProps) {
  return (
    <Input
      {...props}
      classNames={{ ...inputFieldClassNames, ...userClassNames }}
      labelPlacement="outside-top"
      radius="lg"
      variant="bordered"
    />
  );
}
