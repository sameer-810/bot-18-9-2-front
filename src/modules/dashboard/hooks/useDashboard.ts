import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../api/dashboardApi";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardMetrics,
    staleTime: 0,
    refetchInterval: 60_000,
  });
}
