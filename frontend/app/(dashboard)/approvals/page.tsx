"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatRelative } from "@/lib/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckSquare, XCircle } from "lucide-react";

export default function ApprovalsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ items: any[] }>({
    queryKey: ["approvals"],
    queryFn: () => api.get("/approvals/pending").then((r) => r.data),
  });

  const workflows = data?.items || (Array.isArray(data) ? data : []);

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => api.post(`/approvals/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });

  const { mutate: reject } = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.post(`/approvals/${id}/reject?comment=${encodeURIComponent(comment)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Pending Approvals</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{workflows.length} items awaiting your action</p>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 h-20 shimmer" />)
          : workflows.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<CheckSquare className="w-6 h-6" />}
                title="All caught up!"
                description="No pending approvals. New items will appear here when invoices or payments require review."
              />
            </div>
          ) : workflows.map((wf) => (
            <div key={wf.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                  {wf.entity_type} — <span className="font-mono text-[hsl(var(--accent))] text-xs">{wf.entity_id}</span>
                </p>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                  Requested {formatRelative(wf.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(wf.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--success-muted))] hover:bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.2)] text-xs font-medium transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => reject({ id: wf.id, comment: "Rejected by manager" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--danger-muted))] hover:bg-[hsl(var(--danger)/0.2)] text-[hsl(var(--danger))] border border-[hsl(var(--danger)/0.2)] text-xs font-medium transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
