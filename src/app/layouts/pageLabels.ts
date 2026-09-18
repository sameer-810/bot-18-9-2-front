import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

/** Human labels for path segments. */
export const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tenants: "Tenants",
  "my-business": "My business",
  users: "Users",
};

/**
 * A record id in a URL. Mongo ObjectIds are 24 hex characters; anything that is
 * not a known label and follows a collection segment is treated as an id too, so
 * a UUID or slug does not leak into the breadcrumb.
 */
export const isRecordId = (s: string) => /^[a-f\d]{24}$/i.test(s) || /^[\w-]{16,}$/.test(s);

export type Crumb = { label: string; to: string; last: boolean };

/**
 * Crumbs for the current path. Owners and staff never see the Tenants list, so
 * their tenant screen is labelled "My business" with no link back to a list they
 * cannot open.
 */
export function useCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const role = useAppSelector((s) => s.auth.user?.role);
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "dashboard") {
    return [{ label: "Dashboard", to: "/dashboard", last: true }];
  }
  if (segments[0] === "tenants" && segments[1] && role !== "admin") {
    return [{ label: "My business", to: pathname, last: true }];
  }
  return segments.map((seg, i) => ({
    label: PATH_LABELS[seg] ?? (i > 0 && isRecordId(seg) ? "Details" : seg),
    to: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));
}

/** The current screen's name — the top bar title on a phone. */
export function useCurrentPageLabel(): string {
  const crumbs = useCrumbs();
  const leaf = crumbs[crumbs.length - 1];
  if (!leaf) return "Dashboard";
  if (leaf.label === "Details" && crumbs.length > 1) {
    const parent = crumbs[crumbs.length - 2].label;
    return parent.endsWith("s") ? parent.slice(0, -1) : parent;
  }
  return leaf.label;
}
