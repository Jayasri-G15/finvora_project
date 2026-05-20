"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Invoice } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

const STATUSES = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "OVERDUE", "REJECTED"] as const;

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  PAID: "success",
  OVERDUE: "danger",
  REJECTED: "danger",
  VOIDED: "muted",
};

export default function InvoicesPage() {
  const [status, setStatus] = useState("ALL");

  const { data, isLoading } = useQuery<{ items: Invoice[] }>({
    queryKey: ["invoices", status],
    queryFn: () => {
      const params = status !== "ALL" ? `?status=${status}` : "";
      return api.get(`/invoices${params}`).then((r) => r.data);
    },
  });

  const invoices = data?.items || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Invoices</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{invoices.length} invoices</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[hsl(var(--bg-elevated))] w-fit flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              status === s
                ? "bg-[hsl(var(--accent))] text-white"
                : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border-subtle))]">
              {["Invoice #", "Vendor", "Type", "Issue Date", "Due Date", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 section-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border-subtle))]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded-lg shimmer w-20" /></td>
                    ))}
                  </tr>
                ))
              : invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--bg-hover))] transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-[hsl(var(--accent))] text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-[hsl(var(--text-primary))]">{inv.vendor_id || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={inv.type === "RECEIVABLE" ? "success" : "warning"}>{inv.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--text-muted))] text-xs">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-[hsl(var(--text-muted))] text-xs">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[hsl(var(--text-primary))]">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[inv.status] || "muted"}>{inv.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && invoices.length === 0 && (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No invoices found"
            description="Invoices are created automatically when financial emails are processed by n8n."
          />
        )}
      </div>
    </div>
  );
}
