"use client";

import { Select, SelectItem, Textarea, type InputProps } from "@heroui/react";
import type { Key, ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { selectFieldClassNames, selectPopoverClassNames, textareaFieldClassNames } from "./field-styles";
import { TextField } from "./text-field";

type ControlledTextFieldProps<TValues extends FieldValues> = Omit<
  InputProps,
  "defaultValue" | "errorMessage" | "isInvalid" | "name" | "onValueChange" | "value"
> & {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  transform?: (value: string) => string;
};

export function ControlledTextField<TValues extends FieldValues>({
  control,
  name,
  transform,
  isRequired,
  label,
  ...props
}: ControlledTextFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          errorMessage={fieldState.error?.message}
          isInvalid={Boolean(fieldState.error)}
          isRequired={isRequired}
          label={label ? <RequiredLabel isRequired={isRequired}>{label}</RequiredLabel> : label}
          name={field.name}
          value={typeof field.value === "string" ? field.value : ""}
          onBlur={field.onBlur}
          onValueChange={(value) => field.onChange(transform ? transform(value) : value)}
        />
      )}
    />
  );
}

type SelectOption = {
  id: string;
  name: string;
  detail?: string;
};

type ControlledSelectFieldProps<TValues extends FieldValues> = {
  ariaLabel: string;
  control: Control<TValues>;
  isRequired?: boolean;
  label: ReactNode;
  name: FieldPath<TValues>;
  options: SelectOption[];
  placeholder: string;
};

function RequiredLabel({ children, isRequired }: { children: ReactNode; isRequired?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{children}</span>
      {isRequired ? (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      ) : null}
    </span>
  );
}

export function ControlledSelectField<TValues extends FieldValues>({
  ariaLabel,
  control,
  isRequired,
  label,
  name,
  options,
  placeholder,
}: ControlledSelectFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === "string" ? field.value : "";

        return (
          <Select
            aria-label={ariaLabel}
            classNames={selectFieldClassNames}
            errorMessage={fieldState.error?.message}
            isInvalid={Boolean(fieldState.error)}
            isRequired={isRequired}
            label={<RequiredLabel isRequired={isRequired}>{label}</RequiredLabel>}
            labelPlacement="outside"
            placeholder={placeholder}
            popoverProps={{ classNames: selectPopoverClassNames }}
            radius="lg"
            selectedKeys={value ? [value] : []}
            variant="bordered"
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
          >
            {options.map((option) => (
              <SelectItem key={option.id} textValue={option.name}>
                {option.name}
                {option.detail ? ` (${option.detail})` : ""}
              </SelectItem>
            ))}
          </Select>
        );
      }}
    />
  );
}

type ControlledMultiSelectFieldProps<TValues extends FieldValues> = {
  ariaLabel: string;
  control: Control<TValues>;
  isRequired?: boolean;
  label: ReactNode;
  name: FieldPath<TValues>;
  options: SelectOption[];
  placeholder: string;
};

export function ControlledMultiSelectField<TValues extends FieldValues>({
  ariaLabel,
  control,
  isRequired,
  label,
  name,
  options,
  placeholder,
}: ControlledMultiSelectFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = Array.isArray(field.value)
          ? (field.value as unknown[]).filter((item): item is string => typeof item === "string")
          : [];

        return (
          <Select
            aria-label={ariaLabel}
            classNames={selectFieldClassNames}
            errorMessage={fieldState.error?.message}
            isInvalid={Boolean(fieldState.error)}
            isRequired={isRequired}
            label={<RequiredLabel isRequired={isRequired}>{label}</RequiredLabel>}
            labelPlacement="outside"
            placeholder={placeholder}
            popoverProps={{ classNames: selectPopoverClassNames }}
            radius="lg"
            selectedKeys={new Set(value)}
            selectionMode="multiple"
            variant="bordered"
            onBlur={field.onBlur}
            onSelectionChange={(keys) => {
              const selectedKeys = keys === "all" ? options.map((option) => option.id) : Array.from(keys as Set<Key>, String);
              field.onChange(selectedKeys);
            }}
          >
            {options.map((option) => (
              <SelectItem key={option.id} textValue={option.name}>
                {option.name}
                {option.detail ? ` (${option.detail})` : ""}
              </SelectItem>
            ))}
          </Select>
        );
      }}
    />
  );
}

type ControlledTextareaFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  isRequired?: boolean;
  label: string;
  maxLength?: number;
  name: FieldPath<TValues>;
  placeholder?: string;
};

export function ControlledTextareaField<TValues extends FieldValues>({
  control,
  isRequired,
  label,
  maxLength,
  name,
  placeholder,
}: ControlledTextareaFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Textarea
          classNames={textareaFieldClassNames}
          errorMessage={fieldState.error?.message}
          isInvalid={Boolean(fieldState.error)}
          isRequired={isRequired}
          label={label}
          labelPlacement="outside"
          maxLength={maxLength}
          disableAutosize
          maxRows={5}
          minRows={5}
          placeholder={placeholder}
          radius="lg"
          rows={5}
          value={typeof field.value === "string" ? field.value : ""}
          variant="bordered"
          onBlur={field.onBlur}
          onValueChange={field.onChange}
        />
      )}
    />
  );
}
