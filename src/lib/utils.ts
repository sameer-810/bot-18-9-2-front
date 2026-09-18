import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Up to two initials, for the identity disc on a mobile record card. */
export function initialsOf(name: string | undefined | null): string {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Clock time only — for chat bubbles, where the day is implied by the thread. */
export function formatTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/** "5 minutes ago". Falls back to "-" for a missing value. */
export function formatRelative(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatDistanceToNowStrict(d)} ago`;
}

/** Integer with thousands separators, in a fixed locale so every tile reads the same. */
export function formatNumber(n: number | undefined | null): string {
  return new Intl.NumberFormat("en-IN").format(n ?? 0);
}

/** "2026-09-17" → "17 Sep". Parsed as a calendar date, not as UTC midnight. */
export function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
