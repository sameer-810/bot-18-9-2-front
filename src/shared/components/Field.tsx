import type { ReactNode } from "react";
import { labelCls } from "@/shared/lib/formStyles";

/**
 * A labelled form field. The `<label>` wraps its control, so the association
 * holds without threading ids through every call site.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  aside,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  /** Right-aligned beside the label — e.g. a character counter. */
  aside?: ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className={labelCls}>{label}</span>
        {aside}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
