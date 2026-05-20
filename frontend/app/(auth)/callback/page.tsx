"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      // Wait for Supabase to process the PKCE code exchange
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Listen for the auth state change (PKCE flow)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
          if (sess) {
            subscription.unsubscribe();
            await checkOrgAndRedirect(sess.access_token);
          } else if (event === "SIGNED_OUT") {
            subscription.unsubscribe();
            router.replace("/login");
          }
        });
        return;
      }

      await checkOrgAndRedirect(session.access_token);
    }

    async function checkOrgAndRedirect(token: string) {
      try {
        // Check if user has an organization
        const user = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (user.data?.organization_id) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboard");
        }
      } catch {
        // If API call fails (e.g., first ever login), still route to onboard
        router.replace("/onboard");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-[hsl(var(--text-muted))]">Completing sign-in…</p>
    </div>
  );
}
