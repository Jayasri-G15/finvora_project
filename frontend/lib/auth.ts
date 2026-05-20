import { supabase } from "@/lib/supabase";

/** Get the current Supabase access token (used as Bearer for FastAPI). */
export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Sign out via Supabase (clears session cookies + local storage). */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Returns true if there is an active Supabase session. */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// ─── Legacy shims (kept to avoid breaking any remaining call sites) ───────────
/** @deprecated Session is managed by Supabase, not localStorage. */
export function setToken(_token: string): void {}

/** @deprecated Use signOut() instead. */
export function clearToken(): void {
  void signOut();
}
