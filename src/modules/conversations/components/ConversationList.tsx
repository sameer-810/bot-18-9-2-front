import { Search, Users } from "lucide-react";
import { cn, formatDateTime, formatRelative, initialsOf } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { Badge } from "@/shared/components/Badge";
import type { useConversationList } from "../hooks/useConversations";
import { conversationSubtitle, conversationTitle, takeoverActive } from "../lib/display";
import type { Conversation } from "../types";

export function ConversationList({
  query,
  items,
  search,
  onSearchChange,
  hasFilter,
  selectedId,
  onSelect,
}: {
  query: ReturnType<typeof useConversationList>;
  /** Deduplicated across pages by the caller. */
  items: Conversation[];
  search: string;
  onSearchChange: (v: string) => void;
  hasFilter: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const total = data?.pages[0]?.meta.total;

  return (
    <div className="pg-panel flex min-h-0 flex-col overflow-hidden">
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or number…"
            aria-label="Search conversations"
            className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring md:h-9"
          />
        </div>
        {typeof total === "number" && (
          <p className="text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{total}</span> conversations
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            {getApiErrorMessage(error)}
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {hasFilter ? "No conversations match." : "No conversations yet."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => {
              const active = c.id === selectedId;
              const subtitle = conversationSubtitle(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
                      active ? "bg-primary/10" : "hover:bg-accent/40",
                    )}
                  >
                    <span className="pg-disc">
                      {c.isGroup ? (
                        <Users className="h-4 w-4" />
                      ) : c.isSelfChat ? (
                        "ME"
                      ) : (
                        initialsOf(c.contactName || c.phoneNumber)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            active ? "text-primary" : "text-foreground",
                          )}
                        >
                          {conversationTitle(c)}
                        </span>
                        <span
                          className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
                          title={formatDateTime(c.lastMessageAt)}
                        >
                          {c.lastMessageAt ? formatRelative(c.lastMessageAt) : ""}
                        </span>
                      </span>
                      {subtitle && (
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {subtitle}
                        </span>
                      )}
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        {c.isGroup && <Badge>Group</Badge>}
                        {c.isSilenced && <Badge tone="warning">Silenced</Badge>}
                        {c.botPaused && <Badge>AI paused</Badge>}
                        {!c.botPaused && takeoverActive(c) && <Badge>You replied</Badge>}
                        <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                          {c.messageCount} msg
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {hasNextPage && (
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="pg-tap w-full rounded-lg border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 md:min-h-0 md:py-1.5"
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
