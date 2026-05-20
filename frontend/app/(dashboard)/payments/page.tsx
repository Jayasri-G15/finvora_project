"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  SCHEDULED: "warning",
  INITIATED: "info",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
  CANCELLED: "muted",
};

export default function PaymentsPage() {
  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ["payments"],
    queryFn: () => api.get("/payments/").then((r) => r.data),
  });

  const payments = data?.items || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Payments</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{payments.length} payment records</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border-subtle))]">
              {["Date", "Amount", "Method", "Reference", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 section-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border-subtle))]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 shimmer rounded-lg w-20" /></td>
                    ))}
                  </tr>
                ))
              : payments.map((p) => (
                  <tr key={p.id} className="border-b border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
                    <td className="px-4 py-3 text-[hsl(var(--text-muted))] text-xs">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[hsl(var(--text-primary))]">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-[hsl(var(--text-secondary))]">{p.payment_method?.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--text-muted))]">{p.reference_number || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[p.status] || "muted"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && payments.length === 0 && (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No payments recorded"
            description="Payment records will appear here as financial emails are processed."
          />
        )}
      </div>
    </div>
  );
}
