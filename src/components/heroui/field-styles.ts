export const inputFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-semibold text-ink",
  inputWrapper:
    "min-h-12 rounded-lg border border-line bg-panel px-3 shadow-none outline-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/55 data-[hover=true]:bg-panel group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[focus-visible=true]:outline-none group-data-[invalid=true]:border-danger group-data-[invalid=true]:shadow-[0_0_0_3px_rgb(179_64_64_/_0.12)] dark:group-data-[focus=true]:shadow-[0_0_0_3px_rgb(129_140_248_/_0.2)]",
  input: "text-sm font-medium text-ink outline-none placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export const selectFieldClassNames = {
  base: "!mt-0 flex w-full flex-col gap-2 justify-start",
  label: "!relative !start-auto !top-auto !translate-y-0 z-auto block text-sm font-semibold leading-5 text-ink",
  mainWrapper: "w-full",
  trigger:
    "relative h-12 min-h-12 w-full rounded-lg border border-line bg-panel px-3 pr-10 shadow-none outline-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/55 data-[focus=true]:border-primary data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] data-[focus-visible=true]:outline-none data-[open=true]:border-primary data-[open=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[invalid=true]:border-danger",
  value:
    "w-full min-w-0 truncate text-left text-sm font-medium leading-5 text-ink group-data-[has-value=true]:text-ink",
  innerWrapper: "h-full min-h-0 w-full min-w-0 flex-1 items-center",
  selectorIcon: "pointer-events-none absolute end-3 right-3 start-auto left-auto text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;

export const selectPopoverClassNames = {
  base: "z-[120] before:!bg-white dark:before:!bg-slate-900",
  content: "rounded-lg border border-line !bg-white p-1 text-ink shadow-lift backdrop-blur-none dark:!bg-slate-900",
} as const;

export const textareaFieldClassNames = {
  base: "gap-2",
  label: "text-sm font-semibold text-ink",
  inputWrapper:
    "h-[8.5rem] min-h-[8.5rem] max-h-[8.5rem] items-stretch overflow-hidden rounded-lg border border-line bg-panel px-3 py-2 shadow-none outline-none transition-[border-color,box-shadow,background-color] data-[hover=true]:border-primary/55 group-data-[focus=true]:border-primary group-data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.16)] group-data-[focus-visible=true]:outline-none group-data-[invalid=true]:border-danger",
  innerWrapper: "h-full min-h-0 items-stretch overflow-hidden",
  input: "h-full min-h-0 w-full resize-none overflow-y-auto py-0 text-sm font-medium leading-6 text-ink placeholder:text-muted",
  helperWrapper: "min-h-5 px-0 pt-1",
  errorMessage: "text-xs leading-5 text-danger",
} as const;
