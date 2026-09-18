import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/modules/auth/authSlice";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Platform admin",
  owner: "Business owner",
  staff: "Staff",
};

/**
 * What the signed-in user may do, in one place.
 *
 * The server is the authority — these only decide what the UI offers, so a
 * control a role cannot use is hidden or disabled instead of failing with a 403
 * after the click.
 */
export function usePermissions() {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;
  const isAdmin = role === "admin";
  const isOwner = role === "owner";
  const isStaff = role === "staff";

  return {
    user,
    role,
    isAdmin,
    isOwner,
    isStaff,
    tenantId: user?.tenantId ?? null,
    /** Create / delete tenants, change slug and active flag. */
    canAdministerTenants: isAdmin,
    /** Edit agent + channel, connect / disconnect / unlink, clear AI memory. */
    canManageTenant: isAdmin || isOwner,
    canManageUsers: isAdmin || isOwner,
    /** Every role may pause or resume the AI in a single chat. */
    canPauseChats: Boolean(role),
  };
}
