import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "@/types/api";

export function useInvoices(status?: string) {
  return useQuery<Invoice[]>({
    queryKey: ["invoices", status],
    queryFn: () => {
      const params = status ? `?status=${status}` : "";
      return api.get(`/invoices${params}`).then((r) => r.data);
    },
  });
}

export function useInvoiceActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["invoices"] });

  const approve = useMutation({ mutationFn: (id: string) => api.post(`/invoices/${id}/approve`), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/invoices/${id}/reject?reason=${encodeURIComponent(reason)}`), onSuccess: invalidate });
  const markPaid = useMutation({ mutationFn: (id: string) => api.post(`/invoices/${id}/mark-paid`), onSuccess: invalidate });

  return { approve, reject, markPaid };
}
