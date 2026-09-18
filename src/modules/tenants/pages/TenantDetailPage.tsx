import { useParams, useSearchParams } from "react-router-dom";
import { BarChart3, Bot, MessagesSquare, PlugZap, RefreshCw, Smartphone } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { PageLoader } from "@/shared/components/PageLoader";
import { Badge } from "@/shared/components/Badge";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import { ConversationsPanel } from "@/modules/conversations/components/ConversationsPanel";
import { UsageTab } from "@/modules/usage/components/UsageTab";
import { useTenant } from "../hooks/useTenants";
import { WhatsappStatusBadge } from "../components/WhatsappStatusBadge";
import { ConnectionTab } from "../components/ConnectionTab";
import { AgentTab } from "../components/AgentTab";
import { ChannelTab } from "../components/ChannelTab";

type TabKey = "connection" | "agent" | "conversations" | "channel" | "usage";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  manageOnly?: boolean;
}[] = [
  { key: "connection", label: "Connection", icon: Smartphone },
  { key: "agent", label: "Agent", icon: Bot },
  { key: "conversations", label: "Conversations", icon: MessagesSquare },
  { key: "channel", label: "Channel", icon: PlugZap, manageOnly: true },
  { key: "usage", label: "Usage", icon: BarChart3 },
];

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const { canManageTenant } = usePermissions();
  const { data: tenant, isLoading, error, refetch, isFetching } = useTenant(id);

  const tabs = TABS.filter((t) => !t.manageOnly || canManageTenant);
  const requested = params.get("tab") as TabKey | null;
  const active: TabKey = tabs.some((t) => t.key === requested)
    ? (requested as TabKey)
    : "connection";

  function selectTab(key: TabKey) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", key);
        // A selected chat belongs to the Conversations tab only.
        if (key !== "conversations") next.delete("c");
        return next;
      },
      { replace: true },
    );
  }

  if (isLoading) return <PageLoader />;
  if (error || !tenant) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {error ? getApiErrorMessage(error) : "Tenant not found."}
      </div>
    );
  }

  return (
    <div className="erp-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {tenant.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{tenant.slug}</span>
            <WhatsappStatusBadge status={tenant.whatsapp?.status} />
            {tenant.agent?.enabled ? (
              <Badge tone="primary">Agent on</Badge>
            ) : (
              <Badge>Agent off</Badge>
            )}
            {!tenant.isActive && <Badge tone="danger">Suspended</Badge>}
            <span className="hidden text-xs sm:inline">
              {tenant.ownerName ? `${tenant.ownerName} · ` : ""}
              since <span className="font-mono tabular-nums">{formatDate(tenant.createdAt)}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh"
          className="pg-tap flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 md:min-h-0 md:min-w-0 md:border md:border-border md:px-3 md:py-1.5"
        >
          <RefreshCw className={cn("h-4 w-4 md:h-3.5 md:w-3.5", isFetching && "animate-spin")} />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      {/* Tabs: an underlined strip on desktop, a scrolling chip strip on a phone. */}
      <div role="tablist" aria-label="Tenant sections" className="pg-chips md:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            data-active={active === t.key}
            onClick={() => selectTab(t.key)}
            className="pg-chip"
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tablist"
        aria-label="Tenant sections"
        className="hidden items-center gap-1 border-b border-border md:flex"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => selectTab(t.key)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === "connection" && <ConnectionTab tenant={tenant} />}
        {active === "agent" && <AgentTab tenant={tenant} />}
        {active === "conversations" && <ConversationsPanel tenantId={tenant.id} />}
        {active === "channel" && canManageTenant && <ChannelTab tenant={tenant} />}
        {active === "usage" && <UsageTab tenantId={tenant.id} />}
      </div>
    </div>
  );
}
