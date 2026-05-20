"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { FinancialGoal } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Spinner } from "@/components/ui/Spinner";
import { Target, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";

function statusVariant(s: string): "success" | "warning" | "muted" | "danger" | "info" {
  if (s === "ACHIEVED") return "success";
  if (s === "ACTIVE") return "info";
  if (s === "PAUSED") return "warning";
  return "muted";
}

function formatCurrency(amount: string | number, currency = "INR") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function daysUntil(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff} day${diff !== 1 ? "s" : ""} left`;
}

interface GoalFormData {
  title: string;
  description: string;
  target_amount: string;
  currency: string;
  deadline: string;
  category: string;
}

const INITIAL_FORM: GoalFormData = {
  title: "",
  description: "",
  target_amount: "",
  currency: "INR",
  deadline: "",
  category: "",
};

export default function GoalsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<FinancialGoal | null>(null);
  const [form, setForm] = useState<GoalFormData>(INITIAL_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ items: FinancialGoal[] }>({
    queryKey: ["goals"],
    queryFn: () => api.get("/goals/").then((r) => r.data),
  });

  const goals = data?.items || (Array.isArray(data) ? data : []);

  const createMutation = useMutation({
    mutationFn: (body: Partial<GoalFormData>) => api.post("/goals/", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<GoalFormData> }) => api.patch(`/goals/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeModal(); },
  });

  const progressMutation = useMutation({
    mutationFn: (id: string) => api.post(`/goals/${id}/update-progress`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setDeleting(null); },
  });

  function openCreate() {
    setEditGoal(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  }

  function openEdit(goal: FinancialGoal) {
    setEditGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount,
      currency: goal.currency,
      deadline: goal.deadline || "",
      category: goal.category || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditGoal(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      target_amount: parseFloat(form.target_amount),
      description: form.description || undefined,
      deadline: form.deadline || undefined,
      category: form.category || undefined,
    };
    if (editGoal) {
      updateMutation.mutate({ id: editGoal.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Financial Goals</h1>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">Track and achieve your organization&apos;s financial targets</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>New Goal</Button>
      </div>

      {/* Goals grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Target className="w-6 h-6" />}
            title="No financial goals yet"
            description="Set your first financial goal to start tracking progress toward your targets."
            action={{ label: "Create your first goal", onClick: openCreate }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round(goal.progress_pct));
            const overdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status === "ACTIVE";
            return (
              <div key={goal.id} className="card p-5 flex flex-col gap-4">
                {/* Title row */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{goal.title}</h3>
                      <Badge variant={statusVariant(goal.status)}>{goal.status}</Badge>
                    </div>
                    {goal.category && (
                      <Badge variant="muted" className="text-[0.6rem]">{goal.category}</Badge>
                    )}
                  </div>
                  <ProgressRing
                    value={pct}
                    size={60}
                    strokeWidth={6}
                    label={`${pct}%`}
                    color={pct >= 100 ? "hsl(var(--success))" : overdue ? "hsl(var(--danger))" : "hsl(var(--accent))"}
                  />
                </div>

                {/* Amounts */}
                <div>
                  <div className="flex justify-between text-xs text-[hsl(var(--text-muted))] mb-1.5">
                    <span>Progress</span>
                    <span>{formatCurrency(goal.current_amount, goal.currency)} of {formatCurrency(goal.target_amount, goal.currency)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[hsl(var(--bg-elevated))]">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "hsl(var(--success))" : overdue ? "hsl(var(--danger))" : "hsl(var(--accent))",
                      }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                <p className={`text-xs ${overdue ? "text-[hsl(var(--danger))]" : "text-[hsl(var(--text-muted))]"}`}>
                  {daysUntil(goal.deadline)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[hsl(var(--border-subtle))]">
                  <button
                    onClick={() => progressMutation.mutate(goal.id)}
                    disabled={progressMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors px-2 py-1 rounded-lg hover:bg-[hsl(var(--bg-hover))]"
                    title="Recalculate from transactions"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Update
                  </button>
                  <button
                    onClick={() => openEdit(goal)}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors px-2 py-1 rounded-lg hover:bg-[hsl(var(--bg-hover))]"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(goal.id)}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--danger))] transition-colors px-2 py-1 rounded-lg hover:bg-[hsl(var(--bg-hover))] ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editGoal ? "Edit Goal" : "New Financial Goal"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Goal title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Reduce vendor expenses by 20%" required />
          <Input label="Target amount" type="number" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} placeholder="500000" required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-secondary))] mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="input-field"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. revenue" />
          </div>
          <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this goal means for your organization" />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSaving} className="flex-1">{editGoal ? "Save changes" : "Create goal"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Goal" size="sm">
        <p className="text-sm text-[hsl(var(--text-muted))] mb-5">
          Are you sure you want to delete this goal? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)} className="flex-1">Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
