"use client";

import { Input, type InputProps } from "@heroui/react";

import { inputFieldClassNames } from "./form-field-styles";

type TextFieldProps = InputProps;

export function TextField({ classNames: userClassNames, type, ...props }: TextFieldProps) {
  return (
    <Input
      {...props}
      classNames={{ ...inputFieldClassNames, ...userClassNames }}
      color="primary"
      labelPlacement="outside-top"
      radius="lg"
      type={type}
      variant="bordered"
    />
  );
}
