"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AlertNotification } from "@/types/api";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCheck } from "lucide-react";

const SEVERITY_CONFIG = {
  CRITICAL: { icon: AlertCircle, cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  WARNING:  { icon: AlertTriangle, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  INFO:     { icon: Info, cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
};

export default function AlertsPage() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<AlertNotification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/alerts/notifications?limit=50").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Alerts</h1>
          <p className="text-white/40 text-sm mt-1">
            {notifications.filter((n) => !n.is_read).length} unread
          </p>
        </div>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-2/3" />
                  <div className="h-3 shimmer rounded w-1/3" />
                </div>
              </div>
            ))
          : notifications.map((n) => {
              const cfg = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.INFO;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "p-4 flex items-start gap-4 transition-colors",
                    n.is_read ? "opacity-50" : "hover:bg-white/3"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0", cfg.cls)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{n.message}</p>
                    <p className="text-xs text-white/30 mt-1">{formatRelative(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">No alerts. All clear!</div>
        )}
      </div>
    </div>
  );
}
