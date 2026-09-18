/** IANA zones supported by this browser, for a timezone `<datalist>`. */
export function listTimezones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf;
    if (fn) return fn("timeZone");
  } catch {
    // older engines
  }
  return ["UTC", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York"];
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Digits only — the backend stores numbers with country code and no `+` or spaces. */
export function normalizePhone(v: string): string {
  return v.replace(/[^\d]/g, "");
}

export const PHONE_RE = /^\d{8,15}$/;
