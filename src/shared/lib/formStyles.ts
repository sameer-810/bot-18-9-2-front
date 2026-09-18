/** The house input style, shared by every form. Same classes as the reference forms. */
export const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

export const primaryBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";

export const dangerBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50";
