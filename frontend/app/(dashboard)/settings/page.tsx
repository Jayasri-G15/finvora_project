"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { GmailStatus } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  User, Building2, Mail, Shield, RefreshCw, CheckCircle2, XCircle,
  Eye, EyeOff, Lock, Copy, Check,
} from "lucide-react";

type Tab = "profile" | "organization" | "gmail" | "security";

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-150 ${
        active ? "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.2)]" : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-hover))]"
      }`}
    >
      {children}
    </button>
  );
}

function SettingsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, organization, refetch } = useAuthContext();

  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "profile");
  const [syncDays, setSyncDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [showPwFields, setShowPwFields] = useState(false);
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: organization?.name || "", email: organization?.email || "" });

  const { data: gmailStatus, isLoading: gmailLoading } = useQuery<GmailStatus>({
    queryKey: ["gmail-status"],
    queryFn: () => api.get("/gmail/status").then((r) => r.data),
    enabled: tab === "gmail",
    retry: false,
  });

  const updateOrgMutation = useMutation({
    mutationFn: (body: { name?: string; email?: string }) => api.patch("/organizations/me", body),
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["organization"] }); },
  });

  async function handleTriggerSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      await api.post("/gmail/trigger-sync", { days_back: syncDays });
      setSyncMsg(`Sync triggered for last ${syncDays} days. Emails will appear shortly.`);
    } catch {
      setSyncMsg("Failed to trigger sync. Check your n8n webhook configuration.");
    } finally {
      setSyncing(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pw.new !== pw.confirm) { setPwMsg("Passwords do not match."); return; }
    if (pw.new.length < 8) { setPwMsg("Password must be at least 8 characters."); return; }
    setPwLoading(true);
    setPwMsg("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.new });
      if (error) { setPwMsg(error.message); }
      else { setPwMsg("Password updated successfully!"); setPw({ current: "", new: "", confirm: "" }); setShowPwFields(false); }
    } catch {
      setPwMsg("Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  }

  function copyWebhookUrl() {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/webhooks/n8n/email`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Settings</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">Manage your account, organization, and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}><User className="w-3.5 h-3.5" />Profile</TabBtn>
        <TabBtn active={tab === "organization"} onClick={() => setTab("organization")}><Building2 className="w-3.5 h-3.5" />Organization</TabBtn>
        <TabBtn active={tab === "gmail"} onClick={() => setTab("gmail")}><Mail className="w-3.5 h-3.5" />Gmail Integration</TabBtn>
        <TabBtn active={tab === "security"} onClick={() => setTab("security")}><Shield className="w-3.5 h-3.5" />Security</TabBtn>
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card p-6 space-y-5">
          <p className="section-label">PROFILE INFORMATION</p>
          <div className="flex items-center gap-4">
            {user?.picture_url ? (
              <Image src={user.picture_url} alt={user.full_name || ""} width={56} height={56} className="rounded-2xl" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent-muted))] flex items-center justify-center text-xl font-bold text-[hsl(var(--accent))]">
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-[hsl(var(--text-primary))]">{user?.full_name}</p>
              <p className="text-sm text-[hsl(var(--text-muted))]">{user?.email}</p>
              <Badge variant="muted" className="mt-1">{user?.role || "member"}</Badge>
            </div>
          </div>
          <div className="divider" />
          <p className="text-sm text-[hsl(var(--text-muted))]">
            Profile name and avatar are synced from your Supabase auth provider. To change them, update your Google account or use the Security tab to change your password.
          </p>
        </div>
      )}

      {/* Organization Tab */}
      {tab === "organization" && (
        <div className="card p-6 space-y-5">
          <p className="section-label">ORGANIZATION DETAILS</p>
          {organization ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-muted))] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[hsl(var(--text-primary))]">{organization.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[hsl(var(--text-muted))]">/{organization.slug}</p>
                    <Badge variant={organization.plan === "free" ? "muted" : "accent"}>{organization.plan}</Badge>
                  </div>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); updateOrgMutation.mutate(orgForm); }}
                className="space-y-4"
              >
                <Input label="Organization name" value={orgForm.name} onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))} />
                <Input label="Organization email" type="email" value={orgForm.email} onChange={(e) => setOrgForm((f) => ({ ...f, email: e.target.value }))} placeholder="billing@company.com" />
                <Button type="submit" loading={updateOrgMutation.isPending} variant="secondary">Save changes</Button>
              </form>
            </>
          ) : (
            <p className="text-sm text-[hsl(var(--text-muted))]">No organization linked. Complete onboarding to create one.</p>
          )}
        </div>
      )}

      {/* Gmail Tab */}
      {tab === "gmail" && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="card p-5">
            <p className="section-label mb-4">CONNECTION STATUS</p>
            {gmailLoading ? (
              <div className="flex items-center gap-2"><Spinner size="sm" /><span className="text-sm text-[hsl(var(--text-muted))]">Checking…</span></div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${gmailStatus?.connected ? "bg-[hsl(var(--success-muted))] border-[hsl(var(--success)/0.2)]" : "bg-[hsl(var(--bg-elevated))] border-[hsl(var(--border-subtle))]"}`}>
                  {gmailStatus?.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                      {gmailStatus?.connected ? "Gmail connected" : "Gmail not connected"}
                    </p>
                    <p className="text-xs text-[hsl(var(--text-muted))]">
                      {gmailStatus?.last_sync_at ? `Last sync: ${new Date(gmailStatus.last_sync_at).toLocaleString()}` : "Never synced"}
                    </p>
                  </div>
                </div>
                {gmailStatus?.connected && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total emails", value: gmailStatus.total_emails },
                      { label: "This month", value: gmailStatus.emails_this_month },
                      { label: "Needs review", value: gmailStatus.pending_review },
                    ].map(({ label, value }) => (
                      <div key={label} className="card-elevated p-3 text-center">
                        <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{value}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trigger Sync */}
          <div className="card p-5">
            <p className="section-label mb-4">HISTORICAL SYNC</p>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-4">
              Trigger a historical sync to import past financial emails from Gmail. n8n will process them through GPT-4o.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[hsl(var(--text-secondary))] mb-1.5">Days back</label>
                <input
                  type="number"
                  value={syncDays}
                  onChange={(e) => setSyncDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="input-field w-32"
                />
              </div>
              <Button
                onClick={handleTriggerSync}
                loading={syncing}
                variant="secondary"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Sync Now
              </Button>
            </div>
            {syncMsg && (
              <p className={`mt-3 text-sm ${syncMsg.includes("Failed") ? "text-[hsl(var(--danger))]" : "text-[hsl(var(--success))]"}`}>
                {syncMsg}
              </p>
            )}
          </div>

          {/* Webhook URL */}
          <div className="card p-5">
            <p className="section-label mb-4">N8N WEBHOOK URL</p>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-3">
              Configure this URL in your n8n workflow HTTP Request node to send financial emails to Finvora AI.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--bg-elevated))] text-xs text-[hsl(var(--text-secondary))] font-mono truncate border border-[hsl(var(--border-subtle))]">
                {process.env.NEXT_PUBLIC_API_BASE_URL}/webhooks/n8n/email
              </code>
              <button
                onClick={copyWebhookUrl}
                className="p-2 rounded-lg hover:bg-[hsl(var(--bg-hover))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-[hsl(var(--success))]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="card p-6 space-y-5">
          <p className="section-label">PASSWORD & SECURITY</p>

          {!showPwFields ? (
            <Button variant="secondary" leftIcon={<Lock className="w-4 h-4" />} onClick={() => setShowPwFields(true)}>
              Change password
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="New password"
                type={showPw ? "text" : "password"}
                value={pw.new}
                onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))}
                placeholder="Min 8 characters"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <Input
                label="Confirm new password"
                type={showPw ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              {pwMsg && (
                <p className={`text-sm ${pwMsg.includes("success") ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]"}`}>{pwMsg}</p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => { setShowPwFields(false); setPwMsg(""); }}>Cancel</Button>
                <Button type="submit" loading={pwLoading}>Update password</Button>
              </div>
            </form>
          )}

          <div className="divider" />
          <div>
            <p className="text-sm font-medium text-[hsl(var(--text-primary))] mb-1">Supabase Auth</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">
              Authentication is handled by Supabase with HS256 JWT verification. Tokens expire automatically and are refreshed client-side.
            </p>
          </div>
          <div className="divider" />
          <Button variant="danger" onClick={handleSignOut} className="w-full sm:w-auto">
            Sign out of all devices
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
