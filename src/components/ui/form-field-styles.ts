export const inputFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "min-h-12 rounded-lg border border-line bg-canvas px-3 shadow-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/45 data-[hover=true]:bg-panel data-[focus=true]:border-primary data-[focus=true]:bg-panel data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] [&:has(input:focus)]:border-primary [&:has(input:focus)]:bg-panel [&:has(input:focus)]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.1)] dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)] dark:[&:has(input:focus)]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)]",
  input: "text-sm text-ink outline-none placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export const selectFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  trigger:
    "min-h-12 rounded-lg border border-line bg-canvas px-3 shadow-none data-[hover=true]:border-primary/45 data-[hover=true]:bg-panel data-[open=true]:border-primary data-[open=true]:bg-panel data-[open=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)]",
  value: "text-sm text-ink group-data-[has-value=true]:text-ink",
  popoverContent: "z-[100] rounded-lg border border-line bg-panel text-ink shadow-panel",
} as const;

export const textareaFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "rounded-lg border border-line bg-canvas px-3 py-2 shadow-none data-[hover=true]:border-primary/45 data-[focus=true]:border-primary data-[focus=true]:bg-panel data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)]",
  input: "text-sm leading-6 text-ink placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;
