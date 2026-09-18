import { useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { ResourceListPage, type Column } from "@/modules/common/ResourceListPage";
import { RecordCard, CardAction } from "@/shared/components/RecordCard";
import { Badge } from "@/shared/components/Badge";
import { formatDate, initialsOf } from "@/lib/utils";
import { useDeleteTenant, useTenants } from "../hooks/useTenants";
import { WhatsappStatusBadge } from "../components/WhatsappStatusBadge";
import { CreateTenantDialog } from "../components/CreateTenantDialog";
import type { Tenant, TenantListQuery } from "../types";

const columns: Column<Tenant>[] = [
  {
    header: "Business",
    getValue: (t) => (
      <div className="min-w-0">
        <Link
          to={`/tenants/${t.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {t.name}
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{t.slug}</p>
      </div>
    ),
  },
  { header: "Owner", getValue: (t) => t.ownerName || "-", className: "text-muted-foreground" },
  {
    header: "WhatsApp",
    getValue: (t) => (
      <div className="flex flex-col items-start gap-1">
        <WhatsappStatusBadge status={t.whatsapp?.status} />
        {t.whatsapp?.phoneNumber && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            +{t.whatsapp.phoneNumber}
          </span>
        )}
      </div>
    ),
  },
  {
    header: "Agent",
    getValue: (t) =>
      t.agent?.enabled ? <Badge tone="primary">On</Badge> : <Badge tone="neutral">Off</Badge>,
  },
  {
    header: "Account",
    getValue: (t) =>
      t.isActive ? <Badge tone="neutral">Active</Badge> : <Badge tone="danger">Suspended</Badge>,
  },
  {
    header: "Created",
    getValue: (t) => formatDate(t.createdAt),
    className: "whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground",
  },
];

export function TenantListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const createOpen = params.get("new") === "1";

  const setCreateOpen = useCallback(
    (open: boolean) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (open) next.set("new", "1");
          else next.delete("new");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const buildQuery = useCallback(
    ({
      search,
      page,
      limit,
    }: {
      search: string;
      page: number;
      limit: number;
    }): TenantListQuery => ({
      page,
      limit,
      ...(search ? { search } : {}),
    }),
    [],
  );

  return (
    <ResourceListPage<Tenant, TenantListQuery>
      title="Tenants"
      subtitle="Businesses running an AI agent on WhatsApp"
      newButtonText="New tenant"
      searchPlaceholder="Search by name, slug or number…"
      emptyText="No tenants yet."
      columns={columns}
      useList={useTenants}
      useDelete={useDeleteTenant}
      buildQuery={buildQuery}
      rowHref={(t) => `/tenants/${t.id}`}
      deleteConfirmText={(t) =>
        `Delete ${t.name}? Its WhatsApp session, conversations and settings are removed. This cannot be undone.`
      }
      createOpen={createOpen}
      onCreateOpenChange={setCreateOpen}
      renderDialog={({ open, onOpenChange }) => (
        <CreateTenantDialog
          open={open}
          onOpenChange={onOpenChange}
          onCreated={(tenant) => navigate(`/tenants/${tenant.id}`)}
        />
      )}
      renderMobileCard={(t, { onRequestDelete }) => (
        <RecordCard
          to={`/tenants/${t.id}`}
          disc={initialsOf(t.name)}
          title={t.name}
          meta={[
            t.ownerName,
            t.whatsapp?.phoneNumber ? `+${t.whatsapp.phoneNumber}` : null,
            `Agent ${t.agent?.enabled ? "on" : "off"}`,
          ]}
          badge={<WhatsappStatusBadge status={t.whatsapp?.status} />}
          actions={
            <CardAction icon={Trash2} label="Delete" onClick={() => onRequestDelete(t.id)} />
          }
        />
      )}
    />
  );
}
