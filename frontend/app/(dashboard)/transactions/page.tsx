"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Transaction } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react";

export default function TransactionsPage() {
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: Transaction[] }>({
    queryKey: ["transactions", type, status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" });
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      return api.get(`/transactions?${params}`).then((r) => r.data);
    },
  });

  const transactions = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Transactions</h1>
          <p className="text-white/40 text-sm mt-1">{transactions.length} records</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          {["CREDIT", "DEBIT"].map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? null : t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                type === t
                  ? t === "CREDIT"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Date", "Description", "Category", "Type", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white/50">{formatDate(t.transaction_date)}</td>
                    <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/50">
                        {t.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.type === "CREDIT" ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <ArrowUpRight className="w-3 h-3" /> Credit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 text-xs">
                          <ArrowDownLeft className="w-3 h-3" /> Debit
                        </span>
                      )}
                    </td>
                    <td className={cn("px-4 py-3 font-mono font-semibold", t.type === "CREDIT" ? "text-emerald-400" : "text-rose-400")}>
                      {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount_inr)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        t.status === "CLEARED" || t.status === "RECONCILED" ? "badge-success" : "badge-warning"
                      )}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            No transactions found. Sync Gmail to extract financial data.
          </div>
        )}
      </div>
    </div>
  );
}
