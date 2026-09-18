import { http, toPaged, type ApiEnvelope } from "@/shared/api/http";
import type {
  Conversation,
  ConversationListQuery,
  Message,
  UpdateConversationPayload,
} from "../types";

const base = (tenantId: string) => `/tenants/${tenantId}/conversations`;

export async function listConversations(tenantId: string, query: ConversationListQuery) {
  const res = await http.get<ApiEnvelope<Conversation[]>>(base(tenantId), { params: query });
  return toPaged(res.data, query);
}

/** Newest first. */
export async function listMessages(
  tenantId: string,
  conversationId: string,
  query: { page: number; limit: number },
) {
  const res = await http.get<ApiEnvelope<Message[]>>(
    `${base(tenantId)}/${conversationId}/messages`,
    { params: query },
  );
  return toPaged(res.data, query);
}

export async function updateConversation(
  tenantId: string,
  conversationId: string,
  payload: UpdateConversationPayload,
) {
  const res = await http.patch<ApiEnvelope<Conversation>>(
    `${base(tenantId)}/${conversationId}`,
    payload,
  );
  return res.data.data;
}

/** Wipes the stored messages, which is the assistant's memory of this chat. */
export async function clearConversationMessages(tenantId: string, conversationId: string) {
  await http.delete(`${base(tenantId)}/${conversationId}/messages`);
}
