export type Conversation = {
  id: string;
  chatId: string;
  isGroup: boolean;
  /** The business number messaging itself — "notes to self". */
  isSelfChat: boolean;
  contactName: string | null;
  phoneNumber: string | null;
  botPaused: boolean;
  humanTakeoverUntil: string | null;
  /** True when the agent will not reply here right now, for whatever reason. */
  isSilenced: boolean;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  messageCount: number;
  createdAt: string;
};

export type MessageRole = "user" | "assistant" | "owner";

export type Message = {
  id: string;
  role: MessageRole;
  kind: "text" | "unsupported";
  text: string | null;
  mediaType: string | null;
  senderName: string | null;
  createdAt: string;
};

export type ConversationListQuery = { page?: number; limit?: number; search?: string };

export type UpdateConversationPayload = {
  botPaused?: boolean;
  humanTakeoverUntil?: null;
};
