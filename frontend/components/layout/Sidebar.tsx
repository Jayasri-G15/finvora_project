"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  LayoutDashboard, ArrowLeftRight, FileText, Users, CreditCard,
  PieChart, CheckSquare, Bell, BarChart3, Mail, Settings, Zap
} from "lucide-react";

const NAV = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.TRANSACTIONS, label: "Transactions", icon: ArrowLeftRight },
  { href: ROUTES.INVOICES, label: "Invoices", icon: FileText },
  { href: ROUTES.VENDORS, label: "Vendors", icon: Users },
  { href: ROUTES.PAYMENTS, label: "Payments", icon: CreditCard },
  { href: ROUTES.BUDGETS, label: "Budgets", icon: PieChart },
  { href: ROUTES.APPROVALS, label: "Approvals", icon: CheckSquare },
  { href: ROUTES.ALERTS, label: "Alerts", icon: Bell },
  { href: ROUTES.REPORTS, label: "Reports", icon: BarChart3 },
  { href: ROUTES.EMAILS, label: "Email Sync", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-navy-900 border-r border-white/5">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-white tracking-tight">Finvora AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-brand/10 text-brand-DEFAULT border border-brand/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-brand-DEFAULT" : "text-white/40 group-hover:text-white/70")} />
              {label}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1 h-4 bg-brand rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-white/5">
        <Link
          href={ROUTES.SETTINGS}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
