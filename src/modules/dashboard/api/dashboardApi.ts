import { http, type ApiEnvelope } from "@/shared/api/http";
import type { DashboardMetrics } from "../types";

/** Scoped by the server to the caller's role — all tenants for admin, one otherwise. */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await http.get<ApiEnvelope<DashboardMetrics>>("/dashboard");
  return res.data.data;
}
