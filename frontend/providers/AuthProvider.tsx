"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { User, Organization } from "@/types/api";

interface AuthContextValue {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  supabaseUser: null,
  user: null,
  organization: null,
  isLoading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: userData } = await api.get<User>("/auth/me");
      setUser(userData);
      // Fetch org if user has one
      if (userData?.organization_id) {
        try {
          const { data: orgData } = await api.get<Organization>("/organizations/me");
          setOrganization(orgData);
        } catch {
          setOrganization(null);
        }
      } else {
        setOrganization(null);
      }
    } catch {
      setUser(null);
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSupabaseUser(data.session?.user ?? null);
      if (data.session) {
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);
      if (newSession) {
        fetchProfile();
      } else {
        setUser(null);
        setOrganization(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        user,
        organization,
        isLoading,
        refetch: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
