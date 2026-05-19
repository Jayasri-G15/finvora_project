"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import api from "@/lib/api";

interface CashFlowPoint {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1">
      <p className="text-white/60 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ₹{p.value?.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

export function CashFlowChart() {
  const { data, isLoading } = useQuery<CashFlowPoint[]>({
    queryKey: ["cash-flow"],
    queryFn: () => api.get("/analytics/cash-flow?months=6").then((r) => r.data),
  });

  if (isLoading) {
    return <div className="glass-card p-6 h-72 shimmer" />;
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Cash Flow</h2>
      <p className="text-xs text-white/40 mb-5">Inflows vs Outflows — last 6 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
          <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fill="url(#inflow)" name="Inflow" />
          <Area type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={2} fill="url(#outflow)" name="Outflow" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
