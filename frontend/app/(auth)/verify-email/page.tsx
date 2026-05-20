"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Zap, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.resend({ type: "signup", email });
      if (err) {
        setError(err.message);
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 30000);
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Animated envelope */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[hsl(var(--accent-muted))] border border-[hsl(var(--accent)/0.2)] mb-8 animate-pulse-ring">
          <Mail className="w-9 h-9 text-[hsl(var(--accent))]" />
        </div>

        <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
          Check your inbox
        </h1>
        <p className="text-[hsl(var(--text-secondary))] mb-2">
          We&apos;ve sent a verification link to:
        </p>
        {email && (
          <p className="text-sm font-semibold text-[hsl(var(--accent))] mb-6 break-all">{email}</p>
        )}
        <p className="text-sm text-[hsl(var(--text-muted))] mb-8 max-w-xs mx-auto">
          Click the link in the email to verify your account. After verification you&apos;ll be guided to set up your organization.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--danger-muted))] border border-[hsl(var(--danger)/0.2)] text-sm text-[hsl(var(--danger))]">
            {error}
          </div>
        )}

        {resent ? (
          <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--success-muted))] border border-[hsl(var(--success)/0.2)] text-sm text-[hsl(var(--success))]">
            Verification email resent! Check your inbox.
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={handleResend}
            loading={resending}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full"
          >
            Resend email
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[hsl(var(--text-primary))]">Finvora AI</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[hsl(var(--bg-base))]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
