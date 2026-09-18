import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { hasMorePages, type Paged } from "@/shared/api/http";
import {
  clearConversationMessages,
  listConversations,
  listMessages,
  updateConversation,
} from "../api/conversationApi";
import type { Conversation, UpdateConversationPayload } from "../types";

const LIST_LIMIT = 30;
const MESSAGE_LIMIT = 40;

export const CONVERSATION_KEYS = {
  all: (tenantId: string) => ["conversations", tenantId] as const,
  list: (tenantId: string, search: string) =>
    [...CONVERSATION_KEYS.all(tenantId), "list", search] as const,
  messages: (tenantId: string, conversationId: string) =>
    [...CONVERSATION_KEYS.all(tenantId), "messages", conversationId] as const,
};

function nextPage<T>(last: Paged<T>) {
  return hasMorePages(last.meta, last.items.length) ? last.meta.page + 1 : undefined;
}

/** Conversation list, most recent first, with "load more". Refreshes every 15s. */
export function useConversationList(tenantId: string, search: string) {
  return useInfiniteQuery({
    queryKey: CONVERSATION_KEYS.list(tenantId, search),
    queryFn: ({ pageParam }) =>
      listConversations(tenantId, {
        page: pageParam,
        limit: LIST_LIMIT,
        ...(search ? { search } : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

/**
 * A thread's messages. Pages come back newest first; page 1 is the latest
 * messages and each further page is older history. Polls every 5s so replies
 * from the assistant and the owner's phone appear without a reload.
 */
export function useConversationMessages(tenantId: string, conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: CONVERSATION_KEYS.messages(tenantId, conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      listMessages(tenantId, conversationId as string, { page: pageParam, limit: MESSAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: Boolean(conversationId),
    staleTime: 0,
    refetchInterval: 5_000,
  });
}

/** Write the updated conversation into every cached list page, so the UI flips instantly. */
function patchCachedConversation(
  qc: ReturnType<typeof useQueryClient>,
  tenantId: string,
  updated: Conversation,
) {
  qc.setQueriesData<InfiniteData<Paged<Conversation>>>(
    { queryKey: [...CONVERSATION_KEYS.all(tenantId), "list"] },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((p) => ({
          ...p,
          items: p.items.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        })),
      },
  );
}

export function useUpdateConversation(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConversationPayload }) =>
      updateConversation(tenantId, id, payload),
    onSuccess: (updated) => {
      if (updated) patchCachedConversation(qc, tenantId, updated);
      return qc.invalidateQueries({
        queryKey: [...CONVERSATION_KEYS.all(tenantId), "list"],
      });
    },
  });
}

export function useClearConversationMessages(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => clearConversationMessages(tenantId, conversationId),
    onSuccess: (_void, conversationId) => {
      qc.removeQueries({ queryKey: CONVERSATION_KEYS.messages(tenantId, conversationId) });
      return qc.invalidateQueries({ queryKey: CONVERSATION_KEYS.all(tenantId) });
    },
  });
}
