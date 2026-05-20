import { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "muted" | "outline" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  muted: "badge-muted",
  accent:
    "inline-flex items-center bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.2)] rounded-full text-[0.7rem] font-semibold px-2 py-0.5 tracking-wide",
  outline:
    "inline-flex items-center bg-transparent text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))] rounded-full text-[0.7rem] font-semibold px-2 py-0.5 tracking-wide",
};

export function Badge({ variant = "muted", children, className = "" }: BadgeProps) {
  return (
    <span className={`${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
}
