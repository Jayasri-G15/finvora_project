"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart } from "lucide-react";

export default function BudgetsPage() {
  const { data: categoriesData, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ["budget-categories"],
    queryFn: () => api.get("/budgets/categories").then((r) => r.data),
  });

  const { data: allocationsData } = useQuery<{ items: any[] }>({
    queryKey: ["budget-allocations"],
    queryFn: () => api.get("/budgets/allocations").then((r) => r.data),
  });

  const categories = categoriesData?.items || (Array.isArray(categoriesData) ? categoriesData : []);
  const allocations = allocationsData?.items || (Array.isArray(allocationsData) ? allocationsData : []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Budgets</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">Category allocations and utilization</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-5 h-32 shimmer" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<PieChart className="w-6 h-6" />}
            title="No budget categories"
            description="Budget categories and allocations will appear here once configured."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const catAllocations = allocations.filter((a: any) => a.category_id === cat.id);
            const totalAllocated = catAllocations.reduce((s: number, a: any) => s + parseFloat(a.allocated_amount || 0), 0);
            const utilized = catAllocations.reduce((s: number, a: any) => s + parseFloat(a.actual_amount || 0), 0);
            const pct = totalAllocated > 0 ? Math.min((utilized / totalAllocated) * 100, 100) : 0;
            const overBudget = pct > 90;
            const nearBudget = pct > 70 && pct <= 90;

            return (
              <div key={cat.id} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  {cat.color_hex && <div className="w-3 h-3 rounded-full" style={{ background: cat.color_hex }} />}
                  <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">{cat.name}</h3>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[hsl(var(--text-muted))]">Utilized</span>
                    <span className={`font-semibold ${overBudget ? "text-[hsl(var(--danger))]" : nearBudget ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[hsl(var(--bg-elevated))]">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: overBudget ? "hsl(var(--danger))" : nearBudget ? "hsl(var(--warning))" : "hsl(var(--success))",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[hsl(var(--text-muted))]">
                    <span>{formatCurrency(utilized.toString())} spent</span>
                    <span>{formatCurrency(totalAllocated.toString())} budget</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
