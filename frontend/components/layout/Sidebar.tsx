"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, FileText, Users, CreditCard,
  PieChart, Target, CheckSquare, Bell, BarChart3, Mail, Settings, Zap,
  LogOut, Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuthContext } from "@/providers/AuthProvider";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
      { href: ROUTES.ANALYTICS, label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    label: "FINANCIAL",
    items: [
      { href: ROUTES.TRANSACTIONS, label: "Transactions", icon: ArrowLeftRight },
      { href: ROUTES.INVOICES, label: "Invoices", icon: FileText },
      { href: ROUTES.PAYMENTS, label: "Payments", icon: CreditCard },
      { href: ROUTES.VENDORS, label: "Vendors", icon: Users },
    ],
  },
  {
    label: "PLANNING",
    items: [
      { href: ROUTES.BUDGETS, label: "Budgets", icon: PieChart },
      { href: ROUTES.GOALS, label: "Financial Goals", icon: Target },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: ROUTES.APPROVALS, label: "Approvals", icon: CheckSquare },
      { href: ROUTES.ALERTS, label: "Alerts", icon: Bell },
      { href: ROUTES.EMAILS, label: "Financial Emails", icon: Mail },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: ROUTES.REPORTS, label: "AI Reports", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization } = useAuthContext();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-[hsl(var(--bg-surface))] border-r border-[hsl(var(--border-subtle))]">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[hsl(var(--border-subtle))]">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-[hsl(var(--text-primary))] tracking-tight">Finvora AI</span>
      </div>

      {/* Org badge */}
      {organization && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-subtle))]">
            <div className="w-6 h-6 rounded-md bg-[hsl(var(--accent-muted))] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[hsl(var(--text-primary))] truncate leading-tight">{organization.name}</p>
              <p className="text-[0.65rem] text-[hsl(var(--text-muted))] capitalize">{organization.plan}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="section-label px-2.5 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={active ? "nav-active flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium" : "nav-inactive flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[hsl(var(--border-subtle))] space-y-0.5">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <span className="text-xs text-[hsl(var(--text-muted))]">Theme</span>
          <ThemeToggle />
        </div>
        <Link
          href={ROUTES.SETTINGS}
          className="nav-inactive flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </Link>

        {/* User */}
        <div className="mt-1 pt-2 border-t border-[hsl(var(--border-subtle))]">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-[hsl(var(--accent-muted))] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[hsl(var(--accent))]">
              {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-[hsl(var(--text-primary))] truncate leading-tight">
                {user?.full_name || "User"}
              </p>
              <p className="text-[0.65rem] text-[hsl(var(--text-muted))] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--danger))] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
