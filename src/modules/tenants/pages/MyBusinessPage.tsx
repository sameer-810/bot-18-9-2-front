import { Navigate } from "react-router-dom";
import { Store } from "lucide-react";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";

/**
 * `/my-business` — a stable URL for "my tenant". Owners and staff go straight to
 * their tenant; the platform admin has no single business, so goes to the list.
 */
export function MyBusinessPage() {
  const { isAdmin, tenantId } = usePermissions();
  if (isAdmin) return <Navigate to="/tenants" replace />;
  if (tenantId) return <Navigate to={`/tenants/${tenantId}`} replace />;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
        <Store className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">No business linked</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Your account is not attached to a business yet. Ask the platform administrator to add you to
        one.
      </p>
    </div>
  );
}
