"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "badge-warning",
  INITIATED: "badge-info",
  PROCESSING: "badge-info",
  COMPLETED: "badge-success",
  FAILED: "badge-danger",
  CANCELLED: "badge-muted",
};

export default function PaymentsPage() {
  const { data: payments = [], isLoading } = useQuery<any[]>({
    queryKey: ["payments"],
    queryFn: () => api.get("/payments/").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Payments</h1>
        <p className="text-white/40 text-sm mt-1">{payments.length} payment records</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Date", "Amount", "Method", "Reference", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 shimmer rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white/50">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-white/60">{p.payment_method?.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/40">{p.reference_number || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", STATUS_STYLE[p.status] || "badge-muted")}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && payments.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">No payment records found.</div>
        )}
      </div>
    </div>
  );
}
