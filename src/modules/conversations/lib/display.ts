import type { Conversation, Message } from "../types";

export function conversationTitle(c: Conversation): string {
  if (c.isSelfChat) return "You (notes to self)";
  if (c.contactName) return c.contactName;
  if (c.phoneNumber) return `+${c.phoneNumber}`;
  return c.chatId;
}

/** The secondary identifier — the number, when the title is a name. */
export function conversationSubtitle(c: Conversation): string | null {
  if (c.isSelfChat) return c.phoneNumber ? `+${c.phoneNumber}` : null;
  if (c.contactName && c.phoneNumber) return `+${c.phoneNumber}`;
  if (c.isGroup) return "Group chat";
  return null;
}

/** Human takeover is active while its end time is still in the future. */
export function takeoverActive(c: Conversation, now = Date.now()): boolean {
  if (!c.humanTakeoverUntil) return false;
  const until = new Date(c.humanTakeoverUntil).getTime();
  return !Number.isNaN(until) && until > now;
}

const MEDIA_LABELS: Record<string, string> = {
  image: "photo",
  photo: "photo",
  video: "video",
  audio: "audio",
  voice: "voice note",
  ptt: "voice note",
  sticker: "sticker",
  document: "document",
  location: "location",
  contact: "contact",
  contacts: "contact",
  poll: "poll",
  reaction: "reaction",
};

/** "[photo]", "[voice note]" … for messages the agent cannot read. */
export function unsupportedLabel(m: Message): string {
  const key = (m.mediaType ?? "").toLowerCase().replace(/message$/, "");
  return `[${MEDIA_LABELS[key] ?? (key || "attachment")}]`;
}
