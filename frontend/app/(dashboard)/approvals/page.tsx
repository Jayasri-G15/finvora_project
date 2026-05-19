"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatRelative } from "@/lib/formatters";
import { CheckSquare, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const qc = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery<any[]>({
    queryKey: ["approvals"],
    queryFn: () => api.get("/approvals/pending").then((r) => r.data),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => api.post(`/approvals/${id}/approve`),
    onSuccess: () => {
      toast.success("Approved");
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      api.post(`/approvals/${id}/reject?comment=${encodeURIComponent(comment)}`),
    onSuccess: () => {
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Pending Approvals</h1>
        <p className="text-white/40 text-sm mt-1">{workflows.length} items awaiting your action</p>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card p-4 h-20 shimmer" />)
          : workflows.map((wf) => (
              <div key={wf.id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {wf.entity_type} — <span className="font-mono text-brand text-xs">{wf.entity_id}</span>
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Requested {formatRelative(wf.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(wf.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => reject({ id: wf.id, comment: "Rejected by manager" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
        {!isLoading && workflows.length === 0 && (
          <div className="glass-card p-12 text-center text-white/30 text-sm">
            No pending approvals. You're all caught up!
          </div>
        )}
      </div>
    </div>
  );
}
