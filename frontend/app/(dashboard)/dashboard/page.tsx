"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { DashboardStats, AIInsight, EmailMessage } from "@/types/api";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SpendBreakdownChart } from "@/components/dashboard/SpendBreakdownChart";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";
import { formatCompact } from "@/lib/formatters";
import {
  TrendingUp, TrendingDown, FileText, Clock,
  Plus, AlertCircle, Lightbulb, Mail, Target, BarChart3,
} from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

function InsightIcon({ type }: { type: string }) {
  if (type.includes("warn") || type.includes("risk")) return <AlertCircle className="w-4 h-4 text-[hsl(var(--warning))]" />;
  if (type.includes("positive") || type.includes("trend")) return <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />;
  return <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))]" />;
}

function severityToVariant(s: string): "success" | "warning" | "danger" | "info" | "muted" {
  if (s === "positive") return "success";
  if (s === "warning") return "warning";
  if (s === "critical") return "danger";
  if (s === "info") return "info";
  return "muted";
}

export default function DashboardPage() {
  const { organization, user } = useAuthContext();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/analytics/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: insightsData } = useQuery<{ insights: AIInsight[] }>({
    queryKey: ["insights"],
    queryFn: () => api.get("/analytics/insights").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: emailsData } = useQuery<{ items: EmailMessage[] }>({
    queryKey: ["recent-emails"],
    queryFn: () => api.get("/emails?limit=5").then((r) => r.data),
    retry: false,
  });

  const insights = insightsData?.insights?.slice(0, 3) || [];
  const recentEmails = emailsData?.items || [];

  const netCashFlow = stats ? parseFloat(stats.net_cash_flow) : 0;
  const netPositive = netCashFlow >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">
          {organization ? `${organization.name}` : "Dashboard"}
        </h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.full_name?.split(" ")[0] || "there"} — here&apos;s your financial overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Cash Flow"
          value={stats ? `₹${formatCompact(Math.abs(netCashFlow))}` : "—"}
          subtitle={netPositive ? "Positive cash position" : "Negative cash position"}
          icon={netPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Total Revenue (MTD)"
          value={stats ? `₹${formatCompact(parseFloat(stats.total_revenue))}` : "—"}
          subtitle="Month to date"
          icon={<TrendingUp className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Total Expenses (MTD)"
          value={stats ? `₹${formatCompact(parseFloat(stats.total_expenses))}` : "—"}
          subtitle="Month to date"
          icon={<TrendingDown className="w-5 h-5" />}
          loading={isLoading}
        />
        <StatCard
          title="Pending Invoices"
          value={stats ? `${stats.pending_invoices_count}` : "—"}
          subtitle={stats ? `₹${formatCompact(parseFloat(stats.pending_invoices_amount))} total` : undefined}
          icon={<FileText className="w-5 h-5" />}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <CashFlowChart />
        </div>
        <div>
          <SpendBreakdownChart />
        </div>
      </div>

      {/* Activity + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Financial Emails */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Recent Financial Emails</h3>
            </div>
            <Link href={ROUTES.EMAILS} className="text-xs text-[hsl(var(--accent))] hover:underline">View all</Link>
          </div>
          {recentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="w-8 h-8 text-[hsl(var(--text-muted))] mb-2" />
              <p className="text-sm text-[hsl(var(--text-muted))]">No emails synced yet</p>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Connect Gmail in Settings to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEmails.map((email) => (
                <div key={email.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--bg-hover))] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--bg-elevated))] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-medium text-[hsl(var(--text-primary))] truncate">{email.subject}</p>
                    <p className="text-[0.65rem] text-[hsl(var(--text-muted))] truncate">{email.sender}</p>
                  </div>
                  {email.financial_type && email.financial_type !== "UNKNOWN" && (
                    <Badge variant="muted" className="flex-shrink-0 text-[0.6rem]">{email.financial_type}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI CFO Insights */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))]" />
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">AI CFO Insights</h3>
            </div>
            <Link href={ROUTES.ANALYTICS} className="text-xs text-[hsl(var(--accent))] hover:underline">Deep analysis</Link>
          </div>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lightbulb className="w-8 h-8 text-[hsl(var(--text-muted))] mb-2" />
              <p className="text-sm text-[hsl(var(--text-muted))]">No insights yet</p>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Insights appear once financial data is synced</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))]">
                  <div className="flex-shrink-0 mt-0.5">
                    <InsightIcon type={insight.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-[hsl(var(--text-primary))]">{insight.title}</p>
                      <Badge variant={severityToVariant(insight.severity)}>{insight.severity}</Badge>
                    </div>
                    <p className="text-[0.7rem] text-[hsl(var(--text-muted))] leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <p className="section-label mb-3">QUICK ACTIONS</p>
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "New Invoice", href: ROUTES.INVOICES, icon: FileText },
            { label: "Record Payment", href: ROUTES.PAYMENTS, icon: Clock },
            { label: "Set Goal", href: ROUTES.GOALS, icon: Target },
            { label: "Generate Report", href: ROUTES.REPORTS, icon: BarChart3 },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-hover))] border border-[hsl(var(--border-subtle))] text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
