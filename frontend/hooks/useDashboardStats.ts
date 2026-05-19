import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DashboardStats } from "@/types/api";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/analytics/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
