"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Zap, Mail, Lock, User, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            organization_name: form.organizationName,
          },
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      // Redirect to verify-email, pass email via query param
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[hsl(var(--bg-surface))] border-r border-[hsl(var(--border-subtle))] p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[hsl(var(--text-primary))]">Finvora AI</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight mb-4">
            Start automating<br />your financial<br />operations today
          </h2>
          <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">
            Connect Gmail, let n8n + GPT-4o do the heavy lifting, and watch your financial data organize itself.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["Free to start", "No credit card", "Setup in 5 min", "AI-powered"].map((tag) => (
              <div key={tag} className="card px-3 py-2 text-xs font-medium text-[hsl(var(--text-secondary))]">
                ✓ {tag}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-[hsl(var(--text-muted))]">
          &copy; {new Date().getFullYear()} Finvora AI
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-5">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[hsl(var(--text-primary))]">Finvora AI</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-sm py-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-1">Create your account</h1>
              <p className="text-sm text-[hsl(var(--text-muted))]">Get started with Finvora AI for free</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--danger-muted))] border border-[hsl(var(--danger)/0.2)] text-sm text-[hsl(var(--danger))]">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full name"
                type="text"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Jane Smith"
                required
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Organization name"
                type="text"
                value={form.organizationName}
                onChange={(e) => set("organizationName", e.target.value)}
                placeholder="Acme Corp"
                required
                leftIcon={<Building2 className="w-4 h-4" />}
              />
              <Input
                label="Work email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@company.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Repeat your password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button type="submit" className="w-full" loading={loading} size="md">
                Create account
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="divider w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-[hsl(var(--text-muted))] bg-[hsl(var(--bg-base))]">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-hover))] border border-[hsl(var(--border))] text-[hsl(var(--text-primary))] text-sm font-medium py-2.5 px-4 rounded-[0.625rem] transition-colors duration-150 disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[hsl(var(--border))] border-t-[hsl(var(--accent))] rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign up with Google
            </button>

            <p className="text-center text-xs text-[hsl(var(--text-muted))] mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-[hsl(var(--accent))] hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
