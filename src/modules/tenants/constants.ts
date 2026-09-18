import type { Tone } from "@/shared/components/Badge";
import type { WhatsappProvider, WhatsappStatus } from "./types";

/**
 * Every connection state in words a business owner understands. `tone` follows
 * the colour rule: only states that need someone to act are coloured.
 */
export const WHATSAPP_STATUS: Record<
  WhatsappStatus,
  { label: string; tone: Tone; description: string }
> = {
  disconnected: {
    label: "Disconnected",
    tone: "neutral",
    description: "Not connected to WhatsApp. Press Connect to link this number.",
  },
  connecting: {
    label: "Connecting…",
    tone: "info",
    description: "Opening a session with WhatsApp. This usually takes a few seconds.",
  },
  pairing: {
    label: "Waiting for pairing",
    tone: "warning",
    description: "Enter the pairing code on the phone that owns this number.",
  },
  connected: {
    label: "Connected",
    tone: "success",
    description: "Linked and receiving messages. The agent replies when it is enabled.",
  },
  logged_out: {
    label: "Logged out",
    tone: "danger",
    description:
      "The linked device was removed from the phone. Connect again to pair with a new code.",
  },
  replaced: {
    label: "Session replaced",
    tone: "warning",
    description:
      "Another WhatsApp Web session took over this connection. Close the other session, then connect again.",
  },
  forbidden: {
    label: "Blocked by WhatsApp",
    tone: "danger",
    description:
      "WhatsApp refused the connection. The number may be banned or temporarily restricted.",
  },
  pairing_expired: {
    label: "Pairing code expired",
    tone: "warning",
    description: "The code was not entered in time. Press Connect to get a fresh one.",
  },
};

/** States in which the backend is actively working on a connection — poll fast. */
export const ACTIVE_CONNECTION_STATES: WhatsappStatus[] = ["connecting", "pairing"];

export const PROVIDER_LABELS: Record<WhatsappProvider, string> = {
  baileys: "WhatsApp Web (free, unofficial)",
  cloud_api: "Official Cloud API",
};

/** Mirrors the backend limit on the knowledge base field. */
export const KNOWLEDGE_BASE_MAX = 50_000;
