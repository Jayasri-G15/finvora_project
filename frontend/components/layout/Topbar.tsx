"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import Image from "next/image";

export function Topbar() {
  const { user } = useAuthContext();

  const { data: alerts } = useQuery({
    queryKey: ["alert-count"],
    queryFn: () => api.get("/alerts/notifications?unread_only=true&limit=1").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const handleSync = async () => {
    await api.post("/emails/sync");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-navy-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-xs text-white/40">Live sync active</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Gmail
        </button>

        <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
          <Bell className="w-4 h-4" />
          {alerts && Array.isArray(alerts) && alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2">
            {user.picture_url ? (
              <Image
                src={user.picture_url}
                alt={user.full_name}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-semibold">
                {user.full_name?.[0]}
              </div>
            )}
            <span className="text-sm text-white/70 hidden md:block">{user.full_name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
