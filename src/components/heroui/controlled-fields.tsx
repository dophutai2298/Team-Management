"use client";

import { Autocomplete, AutocompleteItem, Chip, Input, Listbox, ListboxItem, Textarea, type InputProps } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState, type Key, type ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { useLocale } from "@/lib/i18n/locale-provider";

import { inputFieldClassNames, selectPopoverClassNames, textareaFieldClassNames } from "./field-styles";
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

type SearchableSelectProps = {
  ariaLabel: string;
  compact?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  label?: ReactNode;
  onBlur?: () => void;
  onSelectionChange: (key: Key | null) => void;
  options: SelectOption[];
  placeholder: string;
  selectedKey: string | null;
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

function optionText(option: SelectOption): string {
  return [option.name, option.detail].filter(Boolean).join(" ");
}

export function SearchableSelect({
  ariaLabel,
  compact,
  errorMessage,
  isInvalid,
  isRequired,
  label,
  onBlur,
  onSelectionChange,
  options,
  placeholder,
  selectedKey,
}: SearchableSelectProps) {
  return (
    <Autocomplete
      allowsEmptyCollection
      aria-label={ariaLabel}
      classNames={{
        base: "!mt-0 flex w-full flex-col gap-2 justify-start",
        listbox: "max-h-64 p-1",
        listboxWrapper: "max-h-64",
        popoverContent: "rounded-lg border border-line !bg-white p-1 text-ink shadow-lift dark:!bg-slate-900",
      }}
      defaultFilter={(textValue, inputValue) => textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())}
      errorMessage={errorMessage}
      inputProps={{
        classNames: compact
          ? {
              ...inputFieldClassNames,
              inputWrapper:
                "h-10 min-h-10 rounded-lg border border-line bg-panel px-3 shadow-none outline-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/55 data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[focus-visible=true]:outline-none group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.12)] dark:group-data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
            }
          : inputFieldClassNames,
      }}
      isInvalid={isInvalid}
      isRequired={isRequired}
      label={label ? <RequiredLabel isRequired={isRequired}>{label}</RequiredLabel> : undefined}
      labelPlacement={label ? "outside" : undefined}
      maxListboxHeight={256}
      placeholder={placeholder}
      popoverProps={{ classNames: selectPopoverClassNames }}
      selectedKey={selectedKey}
      variant="bordered"
      onBlur={onBlur}
      onSelectionChange={onSelectionChange}
    >
      {options.map((option) => (
        <AutocompleteItem key={option.id} textValue={optionText(option)}>
          <span className="block text-sm font-medium text-ink">{option.name}</span>
          {option.detail ? <span className="block text-xs text-muted">{option.detail}</span> : null}
        </AutocompleteItem>
      ))}
    </Autocomplete>
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
          <SearchableSelect
            ariaLabel={ariaLabel}
            errorMessage={fieldState.error?.message}
            isInvalid={Boolean(fieldState.error)}
            isRequired={isRequired}
            label={label}
            options={options}
            placeholder={placeholder}
            selectedKey={value || null}
            onBlur={field.onBlur}
            onSelectionChange={(key) => field.onChange(key ? String(key) : "")}
          />
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

        return <SearchableMultiSelect ariaLabel={ariaLabel} errorMessage={fieldState.error?.message} isInvalid={Boolean(fieldState.error)} isRequired={isRequired} label={label} options={options} placeholder={placeholder} value={value} onBlur={field.onBlur} onChange={field.onChange} />;
      }}
    />
  );
}

type SearchableMultiSelectProps = {
  ariaLabel: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  label: ReactNode;
  onBlur: () => void;
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder: string;
  value: string[];
};

function SearchableMultiSelect({
  ariaLabel,
  errorMessage,
  isInvalid,
  isRequired,
  label,
  onBlur,
  onChange,
  options,
  placeholder,
  value,
}: SearchableMultiSelectProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const listboxId = useId();
  const selectedOptions = useMemo(() => options.filter((option) => value.includes(option.id)), [options, value]);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => optionText(option).toLocaleLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-sm font-semibold leading-5 text-ink">{<RequiredLabel isRequired={isRequired}>{label}</RequiredLabel>}</label>
      <div className="relative">
        <Input
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          classNames={inputFieldClassNames}
          endContent={<ChevronDown aria-hidden className="pointer-events-none text-muted" size={16} />}
          isInvalid={isInvalid}
          isRequired={isRequired}
          placeholder={placeholder}
          role="combobox"
          value={query}
          variant="bordered"
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
            onBlur();
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          onValueChange={(nextQuery) => {
            setQuery(nextQuery);
            setIsOpen(true);
          }}
        />
        {isOpen ? (
          <div className="absolute z-[120] mt-1 w-full overflow-hidden rounded-lg border border-line bg-white p-1 shadow-lift dark:bg-slate-900">
            <Listbox
              id={listboxId}
              aria-label={ariaLabel}
              classNames={{ list: "max-h-64 overflow-y-auto" }}
              emptyContent={<span className="px-2 py-3 text-sm text-muted">{t("form.noMatchingOptions")}</span>}
              selectedKeys={new Set(value)}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                const visibleOptionIds = new Set(filteredOptions.map((option) => option.id));
                const selectedVisibleIds = keys === "all" ? filteredOptions.map((option) => option.id) : Array.from(keys as Set<Key>, String);
                onChange([...value.filter((id) => !visibleOptionIds.has(id)), ...selectedVisibleIds]);
              }}
            >
              {filteredOptions.map((option) => (
                <ListboxItem key={option.id} textValue={optionText(option)}>
                  <span className="block text-sm font-medium text-ink">{option.name}</span>
                  {option.detail ? <span className="block text-xs text-muted">{option.detail}</span> : null}
                </ListboxItem>
              ))}
            </Listbox>
          </div>
        ) : null}
      </div>
      {selectedOptions.length > 0 ? (
        <div aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => <Chip key={option.id} className="h-6 max-w-full px-2 text-xs" radius="sm" variant="flat">{option.name}</Chip>)}
        </div>
      ) : null}
      <div className="min-h-5 px-0 pt-1">{errorMessage ? <p className="text-xs leading-5 text-danger">{errorMessage}</p> : null}</div>
    </div>
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
