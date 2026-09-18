import { http, type ApiEnvelope } from "@/shared/api/http";
import type { WhatsappConnection } from "../types";

/** A connection plus the server's human instruction, e.g. where to enter the code. */
export type ConnectionResult = { connection: WhatsappConnection; message?: string };

const base = (tenantId: string) => `/tenants/${tenantId}/whatsapp`;

export async function getConnection(tenantId: string) {
  const res = await http.get<ApiEnvelope<WhatsappConnection>>(base(tenantId));
  return res.data.data;
}

export async function connect(tenantId: string, phoneNumber?: string): Promise<ConnectionResult> {
  const res = await http.post<ApiEnvelope<WhatsappConnection>>(
    `${base(tenantId)}/connect`,
    phoneNumber ? { phoneNumber } : {},
  );
  return { connection: res.data.data, message: res.data.message };
}

export async function disconnect(tenantId: string): Promise<ConnectionResult> {
  const res = await http.post<ApiEnvelope<WhatsappConnection>>(`${base(tenantId)}/disconnect`);
  return { connection: res.data.data, message: res.data.message };
}

/** Unlinks the device from the phone — the next connect needs a new pairing. */
export async function logout(tenantId: string): Promise<ConnectionResult> {
  const res = await http.post<ApiEnvelope<WhatsappConnection>>(`${base(tenantId)}/logout`);
  return { connection: res.data.data, message: res.data.message };
}
