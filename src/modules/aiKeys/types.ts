/**
 * A tenant's own Gemini API keys.
 *
 * The key itself is encrypted on the server and never sent back — only a hint
 * (its last four characters), which is all anyone needs to tell two keys apart.
 */
export type AiKey = {
  id: string;
  /** Free text the owner chose, e.g. "Main key". May be empty. */
  label: string;
  /** Last four characters, e.g. "…o0OA". */
  hint: string;
  createdAt: string;
  /** Resting after a quota error; the agent uses the other keys first. */
  cooling: boolean;
  coolingUntil: string | null;
  /** False when the server's encryption key changed and this one can no longer be read. */
  readable: boolean;
};

export type AiKeyList = {
  keys: AiKey[];
  /** True when the tenant has none of its own and falls back to the platform pool. */
  usingPlatformKeys: boolean;
  platformKeyCount: number;
  maxKeys: number;
};

export type AddAiKeyPayload = {
  label?: string;
  apiKey: string;
};

/** Mirrors the server's validation, so a typo is caught before the round trip. */
export const AI_KEY_LABEL_MAX = 40;
export const AI_KEY_MIN = 20;
export const AI_KEY_MAX = 200;

/** Where a business creates a free Gemini key. */
export const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";
