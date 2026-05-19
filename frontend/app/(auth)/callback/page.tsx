"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setToken(token);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white/50">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
