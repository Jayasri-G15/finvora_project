"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Report } from "@/types/api";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ReportsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Report | null>(null);

  const { data, isLoading } = useQuery<{ items: Report[] }>({
    queryKey: ["reports"],
    queryFn: () => api.get("/reports/").then((r) => r.data),
  });

  const reports = data?.items || (Array.isArray(data) ? data : []);

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => {
      const today = new Date().toISOString().split("T")[0];
      const start = new Date(new Date().setDate(1)).toISOString().split("T")[0];
      return api.post(`/reports/generate?report_type=MONTHLY_SUMMARY&period_start=${start}&period_end=${today}`);
    },
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["reports"] }), 5000);
    },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">AI Reports</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">GPT-4o generated financial intelligence</p>
        </div>
        <Button
          onClick={() => generate()}
          loading={isPending}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Generate Monthly Report
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Report list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 h-20 shimmer" />)
            : reports.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="No reports yet"
                  description="Generate your first AI-powered financial report."
                />
              </div>
            ) : reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full card p-4 text-left hover:shadow-md transition-all ${selected?.id === r.id ? "border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent-muted))]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{r.title}</p>
                    <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{formatDate(r.period_start)} — {formatDate(r.period_end)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {r.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-3 h-3 text-[hsl(var(--success))]" />
                      ) : r.status === "FAILED" ? (
                        <XCircle className="w-3 h-3 text-[hsl(var(--danger))]" />
                      ) : (
                        <Loader2 className="w-3 h-3 text-[hsl(var(--warning))] animate-spin" />
                      )}
                      <span className="text-xs text-[hsl(var(--text-muted))]">{r.status}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>

        {/* Report viewer */}
        <div className="xl:col-span-2 card p-6 min-h-[400px]">
          {selected?.ai_generated_content ? (
            <div className="prose prose-sm max-w-none text-[hsl(var(--text-primary))] [&_h1]:text-[hsl(var(--text-primary))] [&_h2]:text-[hsl(var(--text-primary))] [&_h3]:text-[hsl(var(--text-primary))] [&_p]:text-[hsl(var(--text-secondary))] [&_li]:text-[hsl(var(--text-secondary))] [&_strong]:text-[hsl(var(--text-primary))] [&_hr]:border-[hsl(var(--border-subtle))]">
              <ReactMarkdown>{selected.ai_generated_content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto mb-2" />
                <p className="text-sm text-[hsl(var(--text-muted))]">Select a completed report to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
