import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { cn, formatDateTime, formatNumber, formatRelative, initialsOf } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { StatCard } from "@/shared/components/StatCard";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import { UsageChart } from "@/modules/usage/components/UsageChart";
import { useDashboard } from "../hooks/useDashboard";
import type { RecentConversation } from "../types";

function recentTitle(c: RecentConversation) {
  return c.contactName || (c.phoneNumber ? `+${c.phoneNumber}` : "Unknown contact");
}

export function DashboardPage() {
  const { data, isLoading, isFetching, error, refetch } = useDashboard();
  const { user, isAdmin } = usePermissions();

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        Failed to load dashboard: {getApiErrorMessage(error)}
      </div>
    );
  }

  const today = data?.today;
  const failures = today?.aiFailures ?? 0;
  const disconnected = data ? data.tenants.active - data.tenants.connected : 0;

  return (
    <div className="erp-page">
      {/*
        A page title does not need a container. What earns the space next to it is
        the one fact this screen exists to surface — whether anything needs
        attention right now — stated in words, coloured only when it does.
      */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {user?.name ? `${user.name.split(" ")[0]}'s overview` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? (
              "Loading…"
            ) : failures > 0 ? (
              <>
                <span className="font-mono font-medium tabular-nums text-destructive">
                  {failures}
                </span>{" "}
                AI {failures === 1 ? "reply" : "replies"} failed today
              </>
            ) : isAdmin && disconnected > 0 ? (
              <>
                <span className="font-mono font-medium tabular-nums text-warning">
                  {disconnected}
                </span>{" "}
                active {disconnected === 1 ? "tenant is" : "tenants are"} not connected
              </>
            ) : (
              "No AI failures today"
            )}
          </p>
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: isAdmin ? 7 : 4 }).map((_, i) => (
            <div key={i} className="h-[5.5rem] animate-pulse rounded-lg border border-border" />
          ))}
        </div>
      ) : (
        <>
          {isAdmin && data && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatCard label="Tenants" value={formatNumber(data.tenants.total)} />
              <StatCard
                label="Active tenants"
                value={formatNumber(data.tenants.active)}
                hint={`${formatNumber(data.tenants.total - data.tenants.active)} suspended`}
              />
              <StatCard
                label="Connected"
                value={formatNumber(data.tenants.connected)}
                tone={disconnected > 0 ? "warning" : "neutral"}
                hint={
                  disconnected > 0
                    ? `${formatNumber(disconnected)} active not connected`
                    : "all active tenants online"
                }
                className="col-span-2 lg:col-span-1"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Messages in today"
              value={formatNumber(today?.messagesIn)}
              hint="received from customers"
            />
            <StatCard
              label="Messages out today"
              value={formatNumber(today?.messagesOut)}
              hint="sent by AI and staff"
            />
            <StatCard label="AI calls today" value={formatNumber(today?.aiCalls)} />
            <StatCard
              label="AI failures today"
              value={formatNumber(failures)}
              tone={failures > 0 ? "danger" : "neutral"}
              hint={failures > 0 ? "check the model key and quota" : "none"}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="pg-tile lg:col-span-8">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Last 7 days</h2>
            <p className="text-xs text-muted-foreground">
              Messages in and out, and AI calls{isAdmin ? " across all tenants" : ""}
            </p>
          </div>
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
          ) : (
            <UsageChart days={data?.last7Days ?? []} />
          )}
        </div>

        <div className="pg-tile lg:col-span-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent conversations</h2>
            <p className="text-xs text-muted-foreground">Latest chats with activity</p>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : (data?.recentConversations?.length ?? 0) === 0 ? (
            <div className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {data?.recentConversations.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/tenants/${c.tenantId}?tab=conversations&c=${c.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40"
                  >
                    <span className="pg-disc">{initialsOf(c.contactName || c.phoneNumber)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {recentTitle(c)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {isAdmin
                          ? c.tenantName
                          : c.contactName && c.phoneNumber
                            ? `+${c.phoneNumber}`
                            : ""}
                      </span>
                    </span>
                    <span
                      className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
                      title={formatDateTime(c.lastMessageAt)}
                    >
                      {formatRelative(c.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
