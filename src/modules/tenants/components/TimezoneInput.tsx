import { forwardRef, useMemo, type InputHTMLAttributes } from "react";
import { inputCls } from "@/shared/lib/formStyles";
import { listTimezones } from "../lib/timezones";

/** A free-text timezone field with the IANA list as suggestions. */
export const TimezoneInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TimezoneInput({ className, ...props }, ref) {
    const zones = useMemo(() => listTimezones(), []);
    return (
      <>
        <input
          ref={ref}
          list="tz-options"
          placeholder="e.g. Asia/Kolkata"
          autoComplete="off"
          className={`${inputCls} font-mono ${className ?? ""}`}
          {...props}
        />
        <datalist id="tz-options">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </>
    );
  },
);
