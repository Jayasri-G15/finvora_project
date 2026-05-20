import { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && (
        <div className="mb-4 w-14 h-14 rounded-2xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[hsl(var(--text-primary))] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[hsl(var(--text-muted))] max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
