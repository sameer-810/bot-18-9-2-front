import { http, type ApiEnvelope } from "@/shared/api/http";
import type { TenantUsage } from "../types";

export async function getTenantUsage(tenantId: string, days = 30) {
  const res = await http.get<ApiEnvelope<TenantUsage>>(`/tenants/${tenantId}/usage`, {
    params: { days },
  });
  return res.data.data;
}
