"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { EmailMessage } from "@/types/api";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { RefreshCw, AlertCircle, CheckCircle, Mail, Paperclip } from "lucide-react";
import { toast } from "sonner";

const TYPE_STYLE: Record<string, string> = {
  INVOICE: "badge-info",
  PAYMENT: "badge-success",
  GST: "badge-warning",
  REIMBURSEMENT: "badge-warning",
  VENDOR_BILL: "badge-danger",
  UNKNOWN: "badge-muted",
};

export default function EmailsPage() {
  const { data: messages = [], isLoading, refetch } = useQuery<EmailMessage[]>({
    queryKey: ["emails"],
    queryFn: () => api.get("/emails/?limit=100").then((r) => r.data),
  });

  const { mutate: triggerSync, isPending } = useMutation({
    mutationFn: () => api.post("/emails/sync"),
    onSuccess: () => {
      toast.success("Gmail sync triggered. Processing in background.");
      setTimeout(() => refetch(), 3000);
    },
    onError: () => toast.error("Sync failed. Ensure Gmail is connected in Settings."),
  });

  const processed = messages.filter((m) => m.ai_processed).length;
  const needsReview = messages.filter((m) => m.needs_review).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Email Sync</h1>
          <p className="text-white/40 text-sm mt-1">
            {messages.length} emails · {processed} processed · {needsReview} need review
          </p>
        </div>
        <button
          onClick={() => triggerSync()}
          disabled={isPending}
          className="flex items-center gap-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isPending && "animate-spin")} />
          {isPending ? "Syncing…" : "Sync Gmail"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Fetched", value: messages.length, icon: Mail, color: "text-indigo-400" },
          { label: "AI Processed", value: processed, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Need Review", value: needsReview, icon: AlertCircle, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <s.icon className={cn("w-8 h-8", s.color)} />
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Email list */}
      <div className="glass-card divide-y divide-white/5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <div className="w-8 h-8 rounded shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))
          : messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex items-start gap-4 hover:bg-white/3 transition-colors"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.needs_review ? "bg-amber-500/10" : msg.ai_processed ? "bg-emerald-500/10" : "bg-white/5"
                )}>
                  {msg.needs_review
                    ? <AlertCircle className="w-4 h-4 text-amber-400" />
                    : msg.ai_processed
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <Mail className="w-4 h-4 text-white/30" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{msg.subject}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {msg.has_attachments && <Paperclip className="w-3.5 h-3.5 text-white/30" />}
                      {msg.financial_type && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", TYPE_STYLE[msg.financial_type] || "badge-muted")}>
                          {msg.financial_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{msg.sender} · {formatRelative(msg.received_at)}</p>
                  {msg.confidence_score !== null && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full max-w-24">
                        <div
                          className={cn("h-full rounded-full", msg.confidence_score >= 0.9 ? "bg-emerald-400" : msg.confidence_score >= 0.7 ? "bg-amber-400" : "bg-rose-400")}
                          style={{ width: `${msg.confidence_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/30">{Math.round(msg.confidence_score * 100)}% confidence</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
        {!isLoading && messages.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            No emails synced yet. Click "Sync Gmail" to start importing financial emails.
          </div>
        )}
      </div>
    </div>
  );
}
