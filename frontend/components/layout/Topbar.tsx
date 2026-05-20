"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, RefreshCw, ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/providers/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ROUTES } from "@/lib/constants";

// Map pathname to a readable page title
function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/analytics": "Analytics",
    "/goals": "Financial Goals",
    "/transactions": "Transactions",
    "/invoices": "Invoices",
    "/vendors": "Vendors",
    "/payments": "Payments",
    "/budgets": "Budgets",
    "/approvals": "Approvals",
    "/alerts": "Alerts",
    "/reports": "AI Reports",
    "/emails": "Financial Emails",
    "/settings": "Settings",
  };
  return map[pathname] || "Finvora AI";
}

export function Topbar() {
  const { user, organization } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarOpen, setAvatarOpen] = useState(false);

  const { data: gmailStatus } = useQuery({
    queryKey: ["gmail-status"],
    queryFn: () => api.get("/gmail/status").then((r) => r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: alerts } = useQuery({
    queryKey: ["alert-count"],
    queryFn: () => api.get("/alerts/notifications?unread_only=true&limit=1").then((r) => r.data),
    refetchInterval: 30_000,
    retry: false,
  });

  const unreadAlerts = Array.isArray(alerts) && alerts.length > 0;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleTriggerSync() {
    try {
      await api.post("/gmail/trigger-sync", { days_back: 7 });
    } catch {
      // silent
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-surface))]">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-[hsl(var(--text-primary))]">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Gmail sync status */}
        {gmailStatus && (
          <div className="hidden md:flex items-center gap-2 mr-1">
            <div className={`w-1.5 h-1.5 rounded-full ${gmailStatus.connected ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--text-muted))]"}`} />
            <span className="text-xs text-[hsl(var(--text-muted))]">
              {gmailStatus.connected ? "Gmail synced" : "Gmail not connected"}
            </span>
            {gmailStatus.connected && (
              <button
                onClick={handleTriggerSync}
                className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                title="Trigger sync"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <ThemeToggle />

        {/* Notifications */}
        <Link href={ROUTES.ALERTS} className="relative p-1.5 rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
          <Bell className="w-4 h-4" />
          {unreadAlerts && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--danger))] rounded-full" />
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--bg-hover))] transition-colors"
          >
            {user?.picture_url ? (
              <Image src={user.picture_url} alt={user.full_name || ""} width={28} height={28} className="rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[hsl(var(--accent-muted))] flex items-center justify-center text-xs font-bold text-[hsl(var(--accent))]">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <span className="hidden md:block text-xs font-medium text-[hsl(var(--text-secondary))] max-w-[120px] truncate">
              {user?.full_name || user?.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
          </button>

          {avatarOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAvatarOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 card-elevated border border-[hsl(var(--border))] shadow-lg z-20 py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-[hsl(var(--border-subtle))]">
                  <p className="text-xs font-medium text-[hsl(var(--text-primary))] truncate">{user?.full_name}</p>
                  <p className="text-[0.65rem] text-[hsl(var(--text-muted))] truncate">{user?.email}</p>
                  {organization && (
                    <p className="text-[0.65rem] text-[hsl(var(--accent))] truncate mt-0.5">{organization.name}</p>
                  )}
                </div>
                <Link href={ROUTES.SETTINGS} onClick={() => setAvatarOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
                  <User className="w-3.5 h-3.5" />
                  Profile
                </Link>
                <Link href={`${ROUTES.SETTINGS}?tab=organization`} onClick={() => setAvatarOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--danger))] hover:bg-[hsl(var(--bg-hover))] transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
