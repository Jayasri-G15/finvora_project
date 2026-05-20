"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Zap, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function OnboardPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const meta = data.user.user_metadata || {};
      setUserName(meta.full_name || data.user.email?.split("@")[0] || "");
      // Pre-fill org name from signup metadata
      if (meta.organization_name) {
        setOrgName(meta.organization_name);
        setOrgSlug(slugify(meta.organization_name));
      }
    });
  }, [router]);

  function handleOrgNameChange(val: string) {
    setOrgName(val);
    if (!slugManuallyEdited) {
      setOrgSlug(slugify(val));
    }
  }

  function handleSlugChange(val: string) {
    setSlugManuallyEdited(true);
    setOrgSlug(slugify(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) {
      setError("Organization name and slug are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/onboard", {
        organization_name: orgName.trim(),
        organization_slug: orgSlug.trim(),
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create organization.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-[hsl(var(--text-primary))]">Finvora AI</span>
      </div>

      <div className="w-full max-w-md card-elevated p-8 animate-fade-in">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--accent-muted))] border border-[hsl(var(--accent)/0.2)] flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-1">
            {userName ? `Welcome, ${userName.split(" ")[0]}!` : "Set up your workspace"}
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">
            Create your organization to start using Finvora AI.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--danger-muted))] border border-[hsl(var(--danger)/0.2)] text-sm text-[hsl(var(--danger))]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Organization name"
            type="text"
            value={orgName}
            onChange={(e) => handleOrgNameChange(e.target.value)}
            placeholder="Acme Corp"
            required
            leftIcon={<Building2 className="w-4 h-4" />}
            hint="The name of your company or team"
          />

          <Input
            label="Organization URL slug"
            type="text"
            value={orgSlug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="acme-corp"
            required
            leftIcon={<Globe className="w-4 h-4" />}
            hint={`Used as a unique identifier: finvora.app/${orgSlug || "your-slug"}`}
          />

          <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
            Create organization &amp; continue
          </Button>
        </form>
      </div>

      <p className="text-xs text-[hsl(var(--text-muted))] mt-6">
        You can update these details later in Settings.
      </p>
    </div>
  );
}
