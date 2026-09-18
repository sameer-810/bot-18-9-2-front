import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/modules/auth/authSlice";

/**
 * Route-level role gate. A role that cannot use a screen is sent to the
 * dashboard rather than shown a page of 403 errors — the menu never links there
 * for them, so reaching it means a stale bookmark or a hand-typed URL.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role || !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
