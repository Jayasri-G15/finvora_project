"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: "success" | "danger" | "warning" | "info" | "muted";
  loading?: boolean;
}

const COLOR_MAP = {
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  danger: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  info: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  muted: "text-white/40 bg-white/5 border-white/10",
};

export function StatsCard({ label, value, sub, icon: Icon, color, loading }: StatsCardProps) {
  if (loading) {
    return <div className="glass-card p-4 h-24 shimmer" />;
  }

  return (
    <div className="glass-card p-4 hover:bg-white/8 transition-all duration-200 cursor-default">
      <div className={cn("inline-flex p-1.5 rounded-md border mb-3", COLOR_MAP[color])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="text-xl font-display font-bold text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </div>
  );
}
