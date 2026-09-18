import { LayoutDashboard, Building2, Store, Users } from "lucide-react";
import type { AuthUser, Role } from "@/modules/auth/authSlice";

export type MenuItem = {
  label: string;
  /** Label for the mobile tab bar, where a fifth of a 390px screen is all a tab gets. */
  shortLabel?: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Roles allowed to see this item. Omit = all authenticated roles. */
  roles?: Role[];
  children?: MenuItem[];
};

export type MenuSection = {
  /** Small uppercase group heading (hidden when the rail is collapsed). */
  heading?: string;
  items: MenuItem[];
};

/** Placeholder route for "My business", resolved per user to `/tenants/<tenantId>`. */
export const MY_BUSINESS_PATH = "/my-business";

/**
 * Grouped, role-aware navigation. Items are filtered per role by
 * filterSections(); empty sections are dropped. A flat MENU is derived for the
 * ⌘K command palette.
 */
const SECTIONS: MenuSection[] = [
  {
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Tenants", to: "/tenants", icon: Building2, roles: ["admin"] },
      {
        label: "My business",
        shortLabel: "Business",
        to: MY_BUSINESS_PATH,
        icon: Store,
        roles: ["owner", "staff"],
      },
    ],
  },
  {
    heading: "Administration",
    items: [{ label: "Users", to: "/users", icon: Users, roles: ["admin", "owner"] }],
  },
];

type MenuUser = Pick<AuthUser, "role" | "tenantId"> | null | undefined;

/**
 * "My business" goes straight to the user's own tenant, so the sidebar item is
 * highlighted while they are on it and no redirect hop is needed.
 */
function resolveTo(to: string | undefined, user: MenuUser): string | undefined {
  if (to === MY_BUSINESS_PATH && user?.tenantId) return `/tenants/${user.tenantId}`;
  return to;
}

/** Recursively keep items whose roles include the current role (or have no roles). */
export function filterMenu(items: MenuItem[], user: MenuUser): MenuItem[] {
  const role = user?.role;
  return items
    .filter((item) => !item.roles || (role ? item.roles.includes(role) : false))
    .map((item) => ({
      ...item,
      to: resolveTo(item.to, user),
      children: item.children ? filterMenu(item.children, user) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0 || item.to);
}

/** Filter sections by role and drop any that end up empty. */
export function filterSections(user: MenuUser): MenuSection[] {
  return SECTIONS.map((s) => ({ heading: s.heading, items: filterMenu(s.items, user) })).filter(
    (s) => s.items.length > 0,
  );
}

/** Flat list (all items across sections) — used by the command palette. */
export const MENU: MenuItem[] = SECTIONS.flatMap((s) => s.items);
export { SECTIONS };

/**
 * The destinations shown as tabs on a phone, in bar order. Resolved against the
 * same role-filtered menu the sidebar uses, so the bar can never grant what the
 * sidebar denies.
 */
export function mobileTabs(user: MenuUser): MenuItem[] {
  return filterMenu(MENU, user).filter((i) => i.to);
}
