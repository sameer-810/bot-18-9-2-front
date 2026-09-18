import { useQuery } from "@tanstack/react-query";
import { getTenantUsage } from "../api/usageApi";

export function useTenantUsage(tenantId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["usage", tenantId, days],
    queryFn: () => getTenantUsage(tenantId as string, days),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
