import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number; // percentage change
    label?: string;
  };
  accent?: boolean;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, accent = false, loading = false }: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNeutral = trend && trend.value === 0;

  return (
    <div className={`card p-5 flex flex-col gap-4 ${accent ? "gradient-border" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="section-label mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-32 shimmer rounded-lg mt-1" />
          ) : (
            <p className="text-2xl font-semibold text-[hsl(var(--text-primary))] tracking-tight">
              {value}
            </p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--accent))] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {trend && !loading && (
        <div className="flex items-center gap-1.5">
          {trendNeutral ? (
            <Minus className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
          ) : trendPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-[hsl(var(--danger))]" />
          )}
          <span
            className={`text-xs font-medium ${
              trendNeutral
                ? "text-[hsl(var(--text-muted))]"
                : trendPositive
                ? "text-[hsl(var(--success))]"
                : "text-[hsl(var(--danger))]"
            }`}
          >
            {trendPositive ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          {trend.label && (
            <span className="text-xs text-[hsl(var(--text-muted))]">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
