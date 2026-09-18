import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useConversationList } from "../hooks/useConversations";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";

/**
 * Two panes on desktop — the list stays visible while a thread is open, which
 * is how anyone scans several chats. On a phone they stack: the list, or the
 * thread with a back button, never both squeezed into 390px.
 *
 * The open chat lives in the URL (`?c=`), so the dashboard can deep-link into it
 * and a reload keeps you where you were.
 */
export function ConversationsPanel({ tenantId }: { tenantId: string }) {
  const [params, setParams] = useSearchParams();
  const isMobile = useIsMobile();
  const selectedId = params.get("c");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const listQuery = useConversationList(tenantId, debounced);

  // Dedupe across pages: a new chat arriving between page loads shifts offsets.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (listQuery.data?.pages ?? [])
      .flatMap((p) => p.items)
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [listQuery.data]);

  const selected = items.find((c) => c.id === selectedId) ?? null;

  const select = useCallback(
    (id: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("c", id);
          else next.delete("c");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const showList = !isMobile || !selectedId;
  const showThread = !isMobile || Boolean(selectedId);

  return (
    <div className="grid grid-cols-1 gap-4 md:h-[calc(100vh-15rem)] md:min-h-[32rem] md:grid-cols-[20rem_1fr] lg:grid-cols-[22rem_1fr]">
      {showList && (
        <ConversationList
          query={listQuery}
          items={items}
          search={search}
          onSearchChange={setSearch}
          hasFilter={Boolean(debounced)}
          selectedId={selectedId}
          onSelect={select}
        />
      )}
      {showThread &&
        (selectedId ? (
          <ConversationThread
            key={selectedId}
            tenantId={tenantId}
            conversationId={selectedId}
            conversation={selected}
            onBack={() => select(null)}
          />
        ) : (
          <div className="pg-panel hidden flex-col items-center justify-center gap-2 p-8 text-center md:flex">
            <MessagesSquare className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select a conversation to read it</p>
          </div>
        ))}
    </div>
  );
}
