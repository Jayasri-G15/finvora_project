"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AIInsight, ForecastPoint, SpendTrend } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { TrendingUp, AlertCircle, Lightbulb, BarChart3, Calendar } from "lucide-react";

type Range = "3m" | "6m" | "12m";

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "12 Months", value: "12m" },
];

function severityToVariant(s: string): "success" | "warning" | "danger" | "info" | "muted" {
  if (s === "positive") return "success";
  if (s === "warning") return "warning";
  if (s === "critical") return "danger";
  if (s === "info") return "info";
  return "muted";
}

function formatINR(value: number) {
  return `₹${(value / 1000).toFixed(0)}K`;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("6m");
  const months = range === "3m" ? 3 : range === "12m" ? 12 : 6;

  const { data: forecastData, isLoading: forecastLoading } = useQuery<{ forecast: ForecastPoint[] }>({
    queryKey: ["forecast", months],
    queryFn: () => api.get(`/analytics/forecast?months=${months}`).then((r) => r.data),
    retry: false,
  });

  const { data: spendData, isLoading: spendLoading } = useQuery<{ trends: SpendTrend[] }>({
    queryKey: ["spend-trends", months],
    queryFn: () => api.get(`/analytics/spend-trends?months=${months}`).then((r) => r.data),
    retry: false,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ insights: AIInsight[] }>({
    queryKey: ["insights"],
    queryFn: () => api.get("/analytics/insights").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const forecast = forecastData?.forecast || [];
  const trends = spendData?.trends || [];
  const insights = insightsData?.insights || [];

  // Build stacked bar data from trends
  const allCategories = Array.from(
    new Set(trends.flatMap((t) => t.categories.map((c) => c.name)))
  );

  const spendChartData = trends.map((t) => {
    const row: Record<string, string | number> = { month: t.month };
    t.categories.forEach((c) => { row[c.name] = c.amount; });
    return row;
  });

  const COLORS = [
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--danger))",
    "hsl(var(--info))",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Analytics</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">Deep financial analysis and AI forecasting</p>
        </div>
        {/* Range selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-subtle))]">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                range === opt.value
                  ? "bg-[hsl(var(--accent))] text-white"
                  : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-[hsl(var(--accent))]" />
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Cash Flow Forecast</h2>
          <Badge variant="accent">AI-powered</Badge>
        </div>
        {forecastLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : forecast.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart3 className="w-8 h-8 text-[hsl(var(--text-muted))] mb-2" />
            <p className="text-sm text-[hsl(var(--text-muted))]">Insufficient data for forecast</p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Sync financial emails to generate forecasts</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflow-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158 64% 48%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(158 64% 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflow-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(347 77% 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(347 77% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]}
                contentStyle={{ background: "hsl(var(--bg-elevated))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }}
              />
              <Legend />
              <Area type="monotone" dataKey="projected_inflow" name="Projected Inflow" stroke="hsl(158 64% 48%)" fill="url(#inflow-grad)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Area type="monotone" dataKey="projected_outflow" name="Projected Outflow" stroke="hsl(347 77% 60%)" fill="url(#outflow-grad)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Area type="monotone" dataKey="projected_net" name="Net" stroke="hsl(var(--accent))" fill="none" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spend Trends */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-[hsl(var(--text-muted))]" />
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Spend Trends by Category</h2>
        </div>
        {spendLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : spendChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart3 className="w-8 h-8 text-[hsl(var(--text-muted))] mb-2" />
            <p className="text-sm text-[hsl(var(--text-muted))]">No spend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={spendChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]}
                contentStyle={{ background: "hsl(var(--bg-elevated))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }}
              />
              <Legend />
              {allCategories.map((cat, i) => (
                <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === allCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI CFO Insights */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))]" />
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">AI CFO Insights</h2>
          <Badge variant="accent">GPT-4o</Badge>
        </div>
        {insightsLoading ? (
          <div className="flex items-center justify-center h-24"><Spinner /></div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="w-8 h-8 text-[hsl(var(--text-muted))] mb-2" />
            <p className="text-sm text-[hsl(var(--text-muted))]">No insights generated yet</p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Insights will appear once you have financial transaction data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {insight.severity === "positive" ? (
                      <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />
                    ) : insight.severity === "critical" ? (
                      <AlertCircle className="w-4 h-4 text-[hsl(var(--danger))]" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))]" />
                    )}
                    <Badge variant={severityToVariant(insight.severity)}>{insight.severity}</Badge>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-1">{insight.title}</h3>
                <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed mb-2">{insight.description}</p>
                {insight.action_recommended && (
                  <p className="text-xs text-[hsl(var(--accent))] font-medium">
                    → {insight.action_recommended}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
