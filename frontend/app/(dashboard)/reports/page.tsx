"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Report } from "@/types/api";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BarChart3, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function ReportsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Report | null>(null);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => api.get("/reports/").then((r) => r.data),
  });

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().split("T")[0];
      const start = new Date(new Date().setDate(1)).toISOString().split("T")[0];
      return api.post(`/reports/generate?report_type=MONTHLY_SUMMARY&period_start=${start}&period_end=${today}`);
    },
    onSuccess: () => {
      toast.success("Report generation started.");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["reports"] }), 5000);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">AI Reports</h1>
          <p className="text-white/40 text-sm mt-1">Claude-generated financial intelligence</p>
        </div>
        <button
          onClick={() => generate()}
          disabled={isPending}
          className="flex items-center gap-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Monthly Report
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Report list */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card p-4 h-20 shimmer" />)
            : reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cn(
                    "w-full glass-card p-4 text-left hover:bg-white/8 transition-all",
                    selected?.id === r.id && "border-brand/30 bg-brand/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{formatDate(r.period_start)} — {formatDate(r.period_end)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {r.status === "COMPLETED" ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : r.status === "FAILED" ? (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                        )}
                        <span className="text-xs text-white/30">{r.status}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          {!isLoading && reports.length === 0 && (
            <div className="glass-card p-8 text-center text-white/30 text-sm">
              No reports yet. Generate your first report.
            </div>
          )}
        </div>

        {/* Report viewer */}
        <div className="xl:col-span-2 glass-card p-6">
          {selected?.ai_generated_content ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{selected.ai_generated_content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/20 text-sm">
              Select a completed report to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
