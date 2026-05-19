"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, LogOut, RefreshCw, Shield, Zap } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { user, refetch } = useAuthContext();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const handleGmailReconnect = async () => {
    const { data } = await api.get<{ url: string }>("/auth/google");
    window.location.href = data.url;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post("/emails/sync");
      toast.success("Gmail sync triggered.");
    } catch {
      toast.error("Sync failed. Check Gmail connection.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and integrations</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.picture_url ? (
            <Image src={user.picture_url} alt={user.full_name} width={48} height={48} className="rounded-full ring-2 ring-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand text-lg font-bold">
              {user?.full_name?.[0]}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{user?.full_name}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <span className="text-xs badge-info px-2 py-0.5 rounded-full border mt-1 inline-block">
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Gmail Integration */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Gmail Integration</h2>
        <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow" />
          <span className="text-sm text-emerald-400">
            {user?.gmail_history_id ? "Gmail connected and syncing" : "Gmail not connected"}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
          <button
            onClick={handleGmailReconnect}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Mail className="w-4 h-4" />
            Reconnect Gmail
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Security</h2>
        <p className="text-xs text-white/40">
          OAuth tokens are encrypted using AES-256 (Fernet). Gmail access is read-only. No emails are stored raw beyond extraction.
        </p>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Role: <strong className="text-white">{user?.role}</strong></span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}
