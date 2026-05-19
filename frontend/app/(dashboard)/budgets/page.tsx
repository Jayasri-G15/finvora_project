"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["budget-categories"],
    queryFn: () => api.get("/budgets/categories").then((r) => r.data),
  });

  const { data: allocations = [] } = useQuery<any[]>({
    queryKey: ["budget-allocations"],
    queryFn: () => api.get("/budgets/allocations").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Budgets</h1>
        <p className="text-white/40 text-sm mt-1">Category allocations and utilization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card p-5 h-32 shimmer" />)
          : categories.map((cat) => {
              const catAllocations = allocations.filter((a) => a.category_id === cat.id);
              const totalAllocated = catAllocations.reduce((s: number, a: any) => s + parseFloat(a.allocated_amount || 0), 0);
              const utilized = Math.random() * totalAllocated; // placeholder — replace with real spend query
              const pct = totalAllocated > 0 ? Math.min((utilized / totalAllocated) * 100, 100) : 0;

              return (
                <div key={cat.id} className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {cat.color_hex && (
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color_hex }} />
                    )}
                    <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Utilized</span>
                      <span className={cn("font-medium", pct > 90 ? "text-rose-400" : pct > 70 ? "text-amber-400" : "text-emerald-400")}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-rose-400" : pct > 70 ? "bg-amber-400" : "bg-emerald-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-white/40">
                    <span>{formatCurrency(utilized)} spent</span>
                    <span>{formatCurrency(totalAllocated)} allocated</span>
                  </div>
                </div>
              );
            })}
        {!isLoading && categories.length === 0 && (
          <div className="col-span-3 glass-card p-12 text-center text-white/30 text-sm">
            No budget categories. Create one to start tracking spending.
          </div>
        )}
      </div>
    </div>
  );
}
