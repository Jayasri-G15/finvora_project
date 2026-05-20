"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] flex flex-col">
      <div className="flex justify-between items-center p-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[hsl(var(--text-primary))]">Finvora AI</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--success-muted))] border border-[hsl(var(--success)/0.2)] flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[hsl(var(--success))]" />
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">Check your email</h1>
              <p className="text-sm text-[hsl(var(--text-muted))] mb-2">
                We sent a password reset link to:
              </p>
              <p className="text-sm font-semibold text-[hsl(var(--accent))] mb-6">{email}</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-[hsl(var(--accent))] hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-1">Forgot password?</h1>
                <p className="text-sm text-[hsl(var(--text-muted))]">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--danger-muted))] border border-[hsl(var(--danger)/0.2)] text-sm text-[hsl(var(--danger))]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Work email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
