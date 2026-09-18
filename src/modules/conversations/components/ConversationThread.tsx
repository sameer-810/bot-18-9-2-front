import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Eraser, Pause, Play, UserRoundCheck } from "lucide-react";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { Badge } from "@/shared/components/Badge";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { dangerBtnCls, secondaryBtnCls } from "@/shared/lib/formStyles";
import { usePermissions } from "@/modules/auth/hooks/usePermissions";
import {
  useClearConversationMessages,
  useConversationMessages,
  useUpdateConversation,
} from "../hooks/useConversations";
import { conversationSubtitle, conversationTitle, takeoverActive } from "../lib/display";
import { MessageBubble } from "./MessageBubble";
import type { Conversation, Message } from "../types";

/** Within this many px of the bottom counts as "reading the latest". */
const STICKY_PX = 120;

export function ConversationThread({
  tenantId,
  conversationId,
  conversation,
  onBack,
}: {
  tenantId: string;
  conversationId: string;
  /** From the list; null when the chat is not on a loaded page (e.g. a deep link). */
  conversation: Conversation | null;
  onBack: () => void;
}) {
  const { canManageTenant, canPauseChats } = usePermissions();
  const messagesQuery = useConversationMessages(tenantId, conversationId);
  const updateMutation = useUpdateConversation(tenantId);
  const clearMutation = useClearConversationMessages(tenantId);
  const [fromMutation, setFromMutation] = useState<Conversation | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const conv = conversation ?? fromMutation;

  // Pages are newest-first; the thread reads oldest-first. Dedupe because new
  // messages arriving between page loads shift the offsets.
  const messages = useMemo<Message[]>(() => {
    const seen = new Set<string>();
    const flat = (messagesQuery.data?.pages ?? []).flatMap((p) => p.items);
    return flat.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true))).reverse();
  }, [messagesQuery.data]);

  // ── Scroll behaviour ────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const heightBeforeOlder = useRef<number | null>(null);
  const newestId = messages[messages.length - 1]?.id;
  const pageCount = messagesQuery.data?.pages.length ?? 0;

  // Loading older history must not yank the view: keep the same message in place.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || heightBeforeOlder.current === null) return;
    el.scrollTop += el.scrollHeight - heightBeforeOlder.current;
    heightBeforeOlder.current = null;
  }, [pageCount]);

  // New message while reading the latest: follow it. While reading history: stay put.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [newestId]);

  function loadOlder() {
    if (scrollRef.current) heightBeforeOlder.current = scrollRef.current.scrollHeight;
    void messagesQuery.fetchNextPage();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function patch(payload: { botPaused?: boolean; humanTakeoverUntil?: null }, done: string) {
    try {
      const updated = await updateMutation.mutateAsync({ id: conversationId, payload });
      if (updated) setFromMutation(updated);
      toast.success(done);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function clearMemory() {
    try {
      await clearMutation.mutateAsync(conversationId);
      toast.success("AI memory cleared for this chat");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
    setConfirmClear(false);
  }

  const takeover = conv ? takeoverActive(conv) : false;
  const subtitle = conv ? conversationSubtitle(conv) : null;

  return (
    <div className="pg-panel flex min-h-[70vh] flex-col overflow-hidden md:min-h-0">
      {/* Header */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="pg-tap -ml-1 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {conv ? conversationTitle(conv) : "Conversation"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {subtitle && <span className="font-mono">{subtitle}</span>}
              {conv?.isGroup && <Badge>Group</Badge>}
              {conv?.isSilenced && <Badge tone="warning">Silenced</Badge>}
              {conv?.botPaused && <Badge>AI paused</Badge>}
              {takeover && conv?.humanTakeoverUntil && (
                <Badge tone="info">
                  You took over until{" "}
                  <span className="font-mono tabular-nums">
                    {formatDateTime(conv.humanTakeoverUntil)}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {conv && (
          <div className="flex flex-wrap gap-2">
            {canPauseChats && (
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() =>
                  patch(
                    { botPaused: !conv.botPaused },
                    conv.botPaused ? "AI resumed in this chat" : "AI paused in this chat",
                  )
                }
                className={cn(secondaryBtnCls, "py-1.5 text-xs")}
              >
                {conv.botPaused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                {conv.botPaused ? "Resume AI in this chat" : "Pause AI in this chat"}
              </button>
            )}
            {canManageTenant && takeover && (
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => patch({ humanTakeoverUntil: null }, "Takeover ended — AI can reply")}
                className={cn(secondaryBtnCls, "py-1.5 text-xs")}
              >
                <UserRoundCheck className="h-3.5 w-3.5" />
                End takeover
              </button>
            )}
            {canManageTenant && (
              <button
                type="button"
                disabled={clearMutation.isPending}
                onClick={() => setConfirmClear(true)}
                className={cn(dangerBtnCls, "py-1.5 text-xs")}
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear AI memory
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_PX;
        }}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/20 px-3 py-4"
      >
        {messagesQuery.hasNextPage && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={loadOlder}
              disabled={messagesQuery.isFetchingNextPage}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {messagesQuery.isFetchingNextPage ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {messagesQuery.error ? (
          <p role="alert" className="py-8 text-center text-sm text-destructive">
            {getApiErrorMessage(messagesQuery.error)}
          </p>
        ) : messagesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages stored.</p>
        ) : (
          messages.map((m, i) => {
            const day = formatDate(m.createdAt);
            const prevDay = i > 0 ? formatDate(messages[i - 1].createdAt) : null;
            return (
              <Fragment key={m.id}>
                {day !== prevDay && (
                  <div className="flex justify-center py-1">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {day}
                    </span>
                  </div>
                )}
                <MessageBubble message={m} showSender={Boolean(conv?.isGroup)} />
              </Fragment>
            );
          })
        )}
      </div>

      <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        Read-only view. Reply from the WhatsApp app — the assistant pauses in this chat while you
        do.
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear AI memory?"
        message="All stored messages in this chat are deleted. The assistant forgets the conversation and starts fresh with the next message. Messages on the phone are not affected."
        confirmLabel="Clear memory"
        isPending={clearMutation.isPending}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearMemory}
      />
    </div>
  );
}
