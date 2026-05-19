"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Invoice } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUSES = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "OVERDUE", "REJECTED"] as const;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "badge-muted",
  PENDING_APPROVAL: "badge-warning",
  APPROVED: "badge-info",
  PAID: "badge-success",
  OVERDUE: "badge-danger",
  REJECTED: "badge-danger",
  VOIDED: "badge-muted",
};

export default function InvoicesPage() {
  const [status, setStatus] = useState("ALL");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", status],
    queryFn: () => {
      const params = status !== "ALL" ? `?status=${status}` : "";
      return api.get(`/invoices${params}`).then((r) => r.data);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Invoices</h1>
          <p className="text-white/40 text-sm mt-1">{invoices.length} invoices</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              status === s ? "bg-brand text-white shadow-sm" : "text-white/40 hover:text-white"
            )}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Invoice #", "Vendor", "Type", "Issue Date", "Due Date", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/3 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-brand-DEFAULT text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-white">{inv.vendor_id || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded border",
                        inv.type === "RECEIVABLE" ? "badge-success" : "badge-warning"
                      )}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-white/50">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", STATUS_STYLE[inv.status] || "badge-muted")}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && invoices.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">No invoices found for this status.</div>
        )}
      </div>
    </div>
  );
}
