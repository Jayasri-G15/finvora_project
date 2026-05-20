"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AlertNotification } from "@/types/api";
import { formatRelative } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircle, AlertTriangle, Info, CheckCheck, Bell } from "lucide-react";

const SEVERITY_CONFIG = {
  CRITICAL: { icon: AlertCircle, bg: "bg-[hsl(var(--danger-muted))]", text: "text-[hsl(var(--danger))]", border: "border-[hsl(var(--danger)/0.2)]" },
  WARNING:  { icon: AlertTriangle, bg: "bg-[hsl(var(--warning-muted))]", text: "text-[hsl(var(--warning))]", border: "border-[hsl(var(--warning)/0.2)]" },
  INFO:     { icon: Info, bg: "bg-[hsl(var(--info-muted))]", text: "text-[hsl(var(--info))]", border: "border-[hsl(var(--info)/0.2)]" },
};

export default function AlertsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ items: AlertNotification[] }>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/alerts/notifications?limit=50").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const notifications = data?.items || (Array.isArray(data) ? data : []);

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Alerts</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{unread} unread</p>
      </div>

      <div className="card">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3 border-b border-[hsl(var(--border-subtle))]">
                <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded-lg w-2/3" />
                  <div className="h-3 shimmer rounded-lg w-1/3" />
                </div>
              </div>
            ))
          : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-6 h-6" />}
              title="No alerts"
              description="You're all clear! Alerts will appear here when your AI detects important financial events."
            />
          ) : notifications.map((n) => {
            const cfg = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.INFO;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 border-b border-[hsl(var(--border-subtle))] last:border-0 transition-colors ${n.is_read ? "opacity-50" : "hover:bg-[hsl(var(--bg-hover))]"}`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{n.title}</p>
                  <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[hsl(var(--text-muted))] mt-1 opacity-60">{formatRelative(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[hsl(var(--bg-hover))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
