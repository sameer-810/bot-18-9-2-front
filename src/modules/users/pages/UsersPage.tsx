import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Power, RefreshCw, Search } from "lucide-react";
import { cn, formatDate, initialsOf } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { PageLoader } from "@/shared/components/PageLoader";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { Fab } from "@/shared/components/Fab";
import { Badge, type Tone } from "@/shared/components/Badge";
import { RecordCard, CardAction } from "@/shared/components/RecordCard";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { ROLE_LABELS, usePermissions } from "@/modules/auth/hooks/usePermissions";
import { useTenants } from "@/modules/tenants/hooks/useTenants";
import type { Role } from "@/modules/auth/authSlice";
import { useUpdateUser, useUsers } from "../hooks/useUsers";
import { UserDialog } from "../components/UserDialog";
import type { User } from "../types";

const ROLE_TONE: Record<Role, Tone> = { admin: "primary", owner: "info", staff: "neutral" };

const TENANT_LOOKUP_QUERY = { page: 1, limit: 100 };

export function UsersPage() {
  const { isAdmin, user: me } = usePermissions();
  const { data: users, isLoading, isFetching, error, refetch } = useUsers();
  const tenantsQuery = useTenants(TENANT_LOOKUP_QUERY, { enabled: isAdmin });
  const tenants = useMemo(() => tenantsQuery.data?.items ?? [], [tenantsQuery.data]);
  const tenantNames = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);

  const isMobile = useIsMobile();
  const updateMutation = useUpdateUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = users ?? [];
    if (!term) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.tenantId && tenantNames.get(u.tenantId)?.toLowerCase().includes(term)),
    );
  }, [users, search, tenantNames]);

  function openCreate() {
    setMode("create");
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(u: User) {
    setMode("edit");
    setEditing(u);
    setDialogOpen(true);
  }

  async function toggleActive(u: User) {
    try {
      await updateMutation.mutateAsync({ id: u.id, payload: { isActive: !u.isActive } });
      toast.success(u.isActive ? `${u.name} deactivated` : `${u.name} activated`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
    setConfirmToggle(null);
  }

  const businessOf = (u: User) =>
    u.tenantId ? (tenantNames.get(u.tenantId) ?? "—") : u.role === "admin" ? "Platform" : "—";

  return (
    <div className="erp-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="hidden text-xl font-semibold tracking-tight text-foreground md:block">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="hidden md:inline">
              {isAdmin
                ? "Everyone with access to the platform"
                : "People with access to your business"}{" "}
              ·{" "}
            </span>
            <span className="font-mono tabular-nums">{users?.length ?? 0}</span> users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
            className="pg-tap flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 md:min-h-0 md:min-w-0 md:border md:border-border md:px-3 md:py-1.5"
          >
            <RefreshCw className={cn("h-4 w-4 md:h-3.5 md:w-3.5", isFetching && "animate-spin")} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:flex"
          >
            <Plus className="h-4 w-4" />
            New user
          </button>
        </div>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or business…"
          aria-label="Search users"
          className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring md:h-9"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {getApiErrorMessage(error)}
        </div>
      ) : isLoading ? (
        <PageLoader />
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="pg-panel px-4 py-12 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          )}
          {filtered.map((u) => (
            <RecordCard
              key={u.id}
              disc={initialsOf(u.name)}
              title={u.name}
              meta={[u.email, isAdmin ? businessOf(u) : null, `Added ${formatDate(u.createdAt)}`]}
              badge={
                <span className="flex flex-col items-end gap-1">
                  <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  {!u.isActive && <Badge tone="danger">Inactive</Badge>}
                </span>
              }
              actions={
                <>
                  <CardAction icon={Pencil} label="Edit" onClick={() => openEdit(u)} />
                  <CardAction
                    icon={Power}
                    label={u.isActive ? "Deactivate" : "Activate"}
                    disabled={u.id === me?.id}
                    onClick={() => setConfirmToggle(u)}
                  />
                </>
              }
            />
          ))}
        </div>
      ) : (
        <div className="pg-panel max-h-[calc(100vh-17rem)] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="pg-thead">
              <tr className="border-b border-border">
                {[
                  "Name",
                  "Email",
                  "Role",
                  ...(isAdmin ? ["Business"] : []),
                  "Status",
                  "Added",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground",
                      h === "Actions" ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-accent/40">
                    <td className="px-4 py-2.5 font-medium">
                      {u.name}
                      {u.id === me?.id && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        {u.tenantId ? (
                          <Link
                            to={`/tenants/${u.tenantId}`}
                            className="text-foreground hover:text-primary hover:underline"
                          >
                            {businessOf(u)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{businessOf(u)}</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      {u.isActive ? <Badge>Active</Badge> : <Badge tone="danger">Inactive</Badge>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmToggle(u)}
                          disabled={u.id === me?.id}
                          title={u.id === me?.id ? "You cannot deactivate yourself" : undefined}
                          className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Power className="h-3 w-3" /> {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Fab label="New user" onClick={openCreate} />

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        value={editing}
        tenants={tenants}
      />

      <ConfirmDialog
        open={Boolean(confirmToggle)}
        title={confirmToggle?.isActive ? "Deactivate user?" : "Activate user?"}
        message={
          confirmToggle?.isActive
            ? `${confirmToggle.name} will no longer be able to sign in.`
            : `${confirmToggle?.name ?? "This user"} will be able to sign in again.`
        }
        confirmLabel={confirmToggle?.isActive ? "Deactivate" : "Activate"}
        tone={confirmToggle?.isActive ? "danger" : "primary"}
        isPending={updateMutation.isPending}
        onCancel={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleActive(confirmToggle)}
      />
    </div>
  );
}
