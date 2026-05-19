"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899"];

export function SpendBreakdownChart() {
  const { data, isLoading } = useQuery<{ category: string; amount: number; percentage: number }[]>({
    queryKey: ["spend-by-category"],
    queryFn: () => api.get("/analytics/spend-by-category").then((r) => r.data),
  });

  if (isLoading) return <div className="glass-card p-6 h-72 shimmer" />;

  const chartData = (data || []).slice(0, 6);

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Spend by Category</h2>
      <p className="text-xs text-white/40 mb-4">All time breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="amount"
            nameKey="category"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
            contentStyle={{ background: "rgba(13,21,38,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            itemStyle={{ color: "#f8fafc" }}
          />
          <Legend
            formatter={(value) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
