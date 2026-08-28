export const inputFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "min-h-12 rounded-lg border border-line bg-panel px-3 shadow-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/50 data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.1)] dark:data-[focus=true]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)] focus:outline-none",
  input: "text-sm text-ink outline-none placeholder:text-muted ",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export const selectFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  trigger:
    "min-h-12 rounded-lg border border-line bg-panel px-3 shadow-none data-[hover=true]:border-primary/50 data-[open=true]:border-primary data-[open=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger",
  value: "text-sm text-ink group-data-[has-value=true]:text-ink",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export const selectPopoverClassNames = {
  base: "z-[120] before:bg-panel",
  content: "rounded-lg border border-line bg-panel p-1 text-ink shadow-panel",
} as const;

export const textareaFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "h-[8.5rem] min-h-[8.5rem] max-h-[8.5rem] items-stretch overflow-hidden rounded-lg border border-line bg-panel px-3 py-2 shadow-none data-[hover=true]:border-primary/50 data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger",
  innerWrapper: "h-full min-h-0 items-stretch overflow-hidden",
  input: "h-full min-h-0 w-full resize-none overflow-y-auto py-0 text-sm leading-6 text-ink placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;
