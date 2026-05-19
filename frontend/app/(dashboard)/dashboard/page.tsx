"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { DashboardStats } from "@/types/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SpendBreakdownChart } from "@/components/dashboard/SpendBreakdownChart";
import { formatCompact } from "@/lib/formatters";
import {
  TrendingUp, TrendingDown, FileText, AlertTriangle, Clock, Bell
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/analytics/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const cards = stats
    ? [
        {
          label: "Total Revenue",
          value: formatCompact(parseFloat(stats.total_revenue)),
          icon: TrendingUp,
          color: "success" as const,
        },
        {
          label: "Total Expenses",
          value: formatCompact(parseFloat(stats.total_expenses)),
          icon: TrendingDown,
          color: "danger" as const,
        },
        {
          label: "Net Cash Flow",
          value: formatCompact(parseFloat(stats.net_cash_flow)),
          icon: TrendingUp,
          color: parseFloat(stats.net_cash_flow) >= 0 ? ("success" as const) : ("danger" as const),
        },
        {
          label: "Pending Invoices",
          value: `${stats.pending_invoices_count}`,
          sub: formatCompact(parseFloat(stats.pending_invoices_amount)),
          icon: FileText,
          color: "warning" as const,
        },
        {
          label: "Overdue",
          value: `${stats.overdue_invoices_count}`,
          icon: AlertTriangle,
          color: "danger" as const,
        },
        {
          label: "Pending Approvals",
          value: `${stats.pending_approvals_count}`,
          icon: Clock,
          color: "warning" as const,
        },
        {
          label: "Unread Alerts",
          value: `${stats.unread_alerts_count}`,
          icon: Bell,
          color: "info" as const,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Financial Overview</h1>
        <p className="text-white/50 text-sm mt-1">Real-time intelligence from your Gmail financial data</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="glass-card p-4 h-24 shimmer" />
            ))
          : cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <StatsCard {...card} loading={isLoading} />
              </motion.div>
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CashFlowChart />
        </div>
        <div>
          <SpendBreakdownChart />
        </div>
      </div>
    </div>
  );
}
