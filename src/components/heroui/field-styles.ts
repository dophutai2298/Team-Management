export const inputFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-medium text-ink",
  inputWrapper:
    "min-h-12 rounded-lg border border-line bg-canvas px-3 shadow-none outline-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/50 group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[focus-visible=true]:outline-none group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.1)] dark:group-data-[focus=true]:shadow-[0_0_0_3px_rgb(119_214_173_/_0.14)]",
  input: "text-sm text-ink outline-none placeholder:text-muted ",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;


export const selectFieldClassNames = {
  base: "!mt-0 flex w-full flex-col gap-2",
  label: "!relative !start-auto !top-auto !translate-y-0 z-auto block text-sm font-medium leading-5 text-ink",
  mainWrapper: "w-full",
  trigger:
    "h-12 min-h-12 w-full rounded-lg border border-line bg-canvas px-3 shadow-none outline-none data-[hover=true]:border-primary/50 data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] data-[focus-visible=true]:outline-none data-[open=true]:border-primary data-[open=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[invalid=true]:border-danger",
  value:
    "w-full text-left text-sm leading-5 text-ink group-data-[has-value=true]:text-ink",
  innerWrapper: "h-full min-h-0 w-full flex-1",
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
    "h-[8.5rem] min-h-[8.5rem] max-h-[8.5rem] items-stretch overflow-hidden rounded-lg border border-line bg-canvas px-3 py-2 shadow-none outline-none data-[hover=true]:border-primary/50 group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(15_92_69_/_0.12)] group-data-[focus-visible=true]:outline-none group-data-[invalid=true]:border-danger",
  innerWrapper: "h-full min-h-0 items-stretch overflow-hidden",
  input: "h-full min-h-0 w-full resize-none overflow-y-auto py-0 text-sm leading-6 text-ink placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;
