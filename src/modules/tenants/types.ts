export type WhatsappStatus =
  | "disconnected"
  | "connecting"
  | "pairing"
  | "connected"
  | "logged_out"
  | "replaced"
  | "forbidden"
  | "pairing_expired";

export type WhatsappProvider = "baileys" | "cloud_api";

export type ReplyScope = "everyone" | "allowlist";

export type AgentConfig = {
  enabled: boolean;
  name: string;
  instructions: string;
  knowledgeBase: string;
  model: string;
  temperature: number;
  replyScope: ReplyScope;
  allowlist: string[];
  blocklist: string[];
  replyInGroups: boolean;
  historyLimit: number | null;
  humanTakeoverMinutes: number | null;
};

export type TenantWhatsapp = {
  provider: WhatsappProvider;
  phoneNumber: string;
  enabled: boolean;
  status: WhatsappStatus;
  connectedJid: string | null;
  lastConnectedAt: string | null;
  lastDisconnectAt: string | null;
  lastDisconnectReason: string | null;
  cloudApi: { phoneNumberId: string; businessAccountId: string; hasAccessToken: boolean };
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  ownerName: string;
  timezone: string;
  agent: AgentConfig;
  whatsapp: TenantWhatsapp;
  createdAt: string;
  updatedAt: string;
};

export type WhatsappConnection = {
  provider: WhatsappProvider;
  phoneNumber: string;
  enabled: boolean;
  status: WhatsappStatus;
  connectedJid: string | null;
  pairingCode: string | null;
  pairingCodeIssuedAt: string | null;
  qr: string | null;
  lastConnectedAt: string | null;
  lastDisconnectAt: string | null;
  lastDisconnectReason: string | null;
};

export type TenantListQuery = { page?: number; limit?: number; search?: string };

export type CreateTenantPayload = {
  name: string;
  slug?: string;
  ownerName?: string;
  timezone?: string;
  agent?: Partial<AgentConfig>;
  whatsapp?: { phoneNumber?: string };
};

export type UpdateTenantPayload = {
  name?: string;
  ownerName?: string;
  timezone?: string;
  /** Admin only. */
  slug?: string;
  /** Admin only. */
  isActive?: boolean;
  agent?: Partial<AgentConfig>;
  whatsapp?: {
    phoneNumber?: string;
    provider?: WhatsappProvider;
    cloudApi?: { phoneNumberId?: string; businessAccountId?: string; accessToken?: string };
  };
};
