"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Zap, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.replace("/login"), 2500);
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
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--success-muted))] border border-[hsl(var(--success)/0.2)] flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))]" />
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">Password updated!</h1>
              <p className="text-sm text-[hsl(var(--text-muted))]">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-1">Set new password</h1>
                <p className="text-sm text-[hsl(var(--text-muted))]">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--danger-muted))] border border-[hsl(var(--danger)/0.2)] text-sm text-[hsl(var(--danger))]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Input
                  label="Confirm new password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
