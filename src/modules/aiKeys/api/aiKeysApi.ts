import { http, type ApiEnvelope } from "@/shared/api/http";
import type { AddAiKeyPayload, AiKey, AiKeyList } from "../types";

const base = (tenantId: string) => `/tenants/${tenantId}/ai-keys`;

export async function listAiKeys(tenantId: string) {
  const res = await http.get<ApiEnvelope<AiKeyList>>(base(tenantId));
  return res.data.data;
}

/**
 * The server verifies the key with Google before storing it, so this request
 * can take a couple of seconds and answers 422 for a key Google refuses.
 */
export async function addAiKey(tenantId: string, payload: AddAiKeyPayload) {
  const res = await http.post<ApiEnvelope<AiKey>>(base(tenantId), payload);
  return res.data.data;
}

export async function removeAiKey(tenantId: string, keyId: string) {
  await http.delete(`${base(tenantId)}/${keyId}`);
}
