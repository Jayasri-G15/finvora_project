import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PaginatedResponse, Transaction } from "@/types/api";

export function useTransactions(filters?: {
  type?: string;
  status?: string;
  category?: string;
  limit?: number;
}) {
  return useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["transactions", filters],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(filters?.limit || 100) });
      if (filters?.type) params.set("type", filters.type);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.category) params.set("category", filters.category);
      return api.get(`/transactions?${params}`).then((r) => r.data);
    },
  });
}
