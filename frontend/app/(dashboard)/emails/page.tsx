"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { EmailMessage } from "@/types/api";
import { formatRelative } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/lib/constants";
import { AlertCircle, CheckCircle2, Mail, Paperclip, Info } from "lucide-react";

const TYPE_VARIANT: Record<string, "info" | "success" | "warning" | "danger" | "muted"> = {
  INVOICE: "info",
  PAYMENT: "success",
  GST: "warning",
  REIMBURSEMENT: "warning",
  VENDOR_BILL: "danger",
  UNKNOWN: "muted",
};

export default function EmailsPage() {
  const { data, isLoading } = useQuery<{ items: EmailMessage[] }>({
    queryKey: ["emails"],
    queryFn: () => api.get("/emails/?limit=100").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const messages = data?.items || (Array.isArray(data) ? data : []);
  const processed = messages.filter((m) => m.ai_processed).length;
  const needsReview = messages.filter((m) => m.needs_review).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Financial Emails</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
            {messages.length} emails · {processed} processed · {needsReview} need review
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 card px-4 py-3 border-[hsl(var(--accent)/0.2)] text-sm text-[hsl(var(--text-secondary))]">
        <Info className="w-4 h-4 text-[hsl(var(--accent))] flex-shrink-0" />
        <span>
          Emails are imported automatically via your n8n workflow. New financial emails appear within 5 minutes.{" "}
          <Link href={`${ROUTES.SETTINGS}?tab=gmail`} className="text-[hsl(var(--accent))] hover:underline">Configure in Settings →</Link>
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total fetched", value: messages.length, icon: Mail, color: "text-[hsl(var(--accent))]" },
          { label: "AI processed", value: processed, icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
          { label: "Needs review", value: needsReview, icon: AlertCircle, color: "text-[hsl(var(--warning))]" },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon className={`w-7 h-7 ${s.color}`} />
            <div>
              <p className="text-xl font-bold text-[hsl(var(--text-primary))]">{s.value}</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Email list */}
      <div className="card">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3 border-b border-[hsl(var(--border-subtle))]">
                <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded-lg w-3/4" />
                  <div className="h-3 shimmer rounded-lg w-1/2" />
                </div>
              </div>
            ))
          : messages.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6" />}
              title="No financial emails yet"
              description="Configure your n8n Gmail workflow to start automatically importing financial emails."
              action={{ label: "Gmail settings", onClick: () => {} }}
            />
          ) : messages.map((msg) => (
            <div key={msg.id} className="p-4 flex items-start gap-3 border-b border-[hsl(var(--border-subtle))] last:border-0 hover:bg-[hsl(var(--bg-hover))] transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.needs_review ? "bg-[hsl(var(--warning-muted))]" : msg.ai_processed ? "bg-[hsl(var(--success-muted))]" : "bg-[hsl(var(--bg-elevated))]"
              }`}>
                {msg.needs_review ? (
                  <AlertCircle className="w-4 h-4 text-[hsl(var(--warning))]" />
                ) : msg.ai_processed ? (
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                ) : (
                  <Mail className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{msg.subject}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {msg.has_attachments && <Paperclip className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />}
                    {msg.financial_type && msg.financial_type !== "UNKNOWN" && (
                      <Badge variant={TYPE_VARIANT[msg.financial_type] || "muted"}>{msg.financial_type}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                  {msg.sender} · {formatRelative(msg.received_at)}
                </p>
                {msg.confidence_score !== null && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[hsl(var(--bg-elevated))]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${msg.confidence_score * 100}%`,
                          background: msg.confidence_score >= 0.9
                            ? "hsl(var(--success))"
                            : msg.confidence_score >= 0.7
                            ? "hsl(var(--warning))"
                            : "hsl(var(--danger))",
                        }}
                      />
                    </div>
                    <span className="text-xs text-[hsl(var(--text-muted))]">
                      {Math.round(msg.confidence_score * 100)}% confidence
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
