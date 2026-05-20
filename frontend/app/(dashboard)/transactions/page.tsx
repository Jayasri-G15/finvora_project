"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Transaction } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowUpRight, ArrowDownLeft, Filter, ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  const [type, setType] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: Transaction[] }>({
    queryKey: ["transactions", type],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" });
      if (type) params.set("type", type);
      return api.get(`/transactions?${params}`).then((r) => r.data);
    },
  });

  const transactions = data?.items || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Transactions</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{transactions.length} records</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-[hsl(var(--text-muted))]" />
          {[null, "CREDIT", "DEBIT"].map((t) => (
            <button
              key={t || "ALL"}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                type === t
                  ? t === "CREDIT"
                    ? "bg-[hsl(var(--success-muted))] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.2)]"
                    : t === "DEBIT"
                    ? "bg-[hsl(var(--danger-muted))] text-[hsl(var(--danger))] border border-[hsl(var(--danger)/0.2)]"
                    : "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.2)]"
                  : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-hover))]"
              }`}
            >
              {t || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border-subtle))]">
              {["Date", "Description", "Category", "Type", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 section-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border-subtle))]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded-lg shimmer w-20" /></td>
                    ))}
                  </tr>
                ))
              : transactions.map((t) => (
                  <tr key={t.id} className="border-b border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
                    <td className="px-4 py-3 text-[hsl(var(--text-muted))] text-xs">{formatDate(t.transaction_date)}</td>
                    <td className="px-4 py-3 text-[hsl(var(--text-primary))] font-medium max-w-xs truncate">{t.description}</td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{t.category || "—"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {t.type === "CREDIT" ? (
                        <span className="flex items-center gap-1 text-[hsl(var(--success))] text-xs font-medium">
                          <ArrowUpRight className="w-3 h-3" /> Credit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[hsl(var(--danger))] text-xs font-medium">
                          <ArrowDownLeft className="w-3 h-3" /> Debit
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold text-sm ${t.type === "CREDIT" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"}`}>
                      {t.type === "CREDIT" ? "+" : "−"}{formatCurrency(t.amount_inr)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status === "CLEARED" || t.status === "RECONCILED" ? "success" : t.status === "VOIDED" ? "danger" : "warning"}>
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && transactions.length === 0 && (
          <EmptyState
            icon={<ArrowLeftRight className="w-6 h-6" />}
            title="No transactions found"
            description="Sync Gmail to automatically extract financial transaction data."
          />
        )}
      </div>
    </div>
  );
}
