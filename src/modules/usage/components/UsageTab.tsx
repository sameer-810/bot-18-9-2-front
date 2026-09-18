import { useState } from "react";
import { cn, formatDayLabel, formatNumber } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { StatCard } from "@/shared/components/StatCard";
import { useTenantUsage } from "../hooks/useUsage";
import { UsageChart } from "./UsageChart";

const RANGES = [7, 30] as const;

export function UsageTab({ tenantId }: { tenantId: string }) {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, error } = useTenantUsage(tenantId, days);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      >
        {getApiErrorMessage(error)}
      </div>
    );
  }

  const totals = data?.totals;
  // Newest first in the table — the recent days are the ones people check.
  const rows = [...(data?.days ?? [])].reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Last <span className="font-mono tabular-nums text-foreground">{days}</span> days
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={days === r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-xs tabular-nums transition-colors",
                days === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[5.5rem] animate-pulse rounded-lg border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Messages in" value={formatNumber(totals?.messagesIn)} />
          <StatCard label="Messages out" value={formatNumber(totals?.messagesOut)} />
          <StatCard label="AI calls" value={formatNumber(totals?.aiCalls)} />
          <StatCard
            label="AI failures"
            value={formatNumber(totals?.aiFailures)}
            tone={(totals?.aiFailures ?? 0) > 0 ? "danger" : "neutral"}
            hint={
              totals?.aiCalls
                ? `${((100 * (totals.aiFailures ?? 0)) / totals.aiCalls).toFixed(1)}% of calls`
                : undefined
            }
          />
          <StatCard label="Input tokens" value={formatNumber(totals?.inputTokens)} />
          <StatCard label="Output tokens" value={formatNumber(totals?.outputTokens)} />
        </div>
      )}

      <div className="pg-tile">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Daily activity</h2>
          <p className="text-xs text-muted-foreground">Messages received and sent, and AI calls</p>
        </div>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ) : (
          <UsageChart days={data?.days ?? []} />
        )}
      </div>

      <div className="pg-panel max-h-[28rem] overflow-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="pg-thead">
            <tr className="border-b border-border">
              {["Date", "In", "Out", "AI calls", "Failures", "Input tokens", "Output tokens"].map(
                (h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center font-sans text-muted-foreground">
                  {isLoading ? "Loading…" : "No usage recorded"}
                </td>
              </tr>
            ) : (
              rows.map((d) => {
                const quiet = !d.messagesIn && !d.messagesOut && !d.aiCalls;
                return (
                  <tr
                    key={d.date}
                    className={cn(
                      "transition-colors hover:bg-accent/40",
                      quiet && "text-muted-foreground/60",
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-2">
                      {formatDayLabel(d.date)}{" "}
                      <span className="text-muted-foreground/60">{d.date.slice(0, 4)}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.messagesIn)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.messagesOut)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.aiCalls)}</td>
                    <td
                      className={cn(
                        "px-4 py-2 text-right",
                        d.aiFailures > 0 && "font-semibold text-destructive",
                      )}
                    >
                      {formatNumber(d.aiFailures)}
                    </td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.inputTokens)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.outputTokens)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
