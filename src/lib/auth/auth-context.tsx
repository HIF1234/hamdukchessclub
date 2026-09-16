import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export type AppRole = "super_admin" | "school_admin" | "tutor" | "member";
export type AccountState = "unverified" | "pending_payment" | "active" | "expired" | "suspended";

export interface ProfileLite {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  account_state: AccountState;
  membership_level: "beginner" | "intermediate" | "advanced";
  chess_rating: number;
  onboarding_completed: boolean;
  onboarding_step: number;
  membership_type: "club_only" | "club_plus_lecture" | null;
  billing_cycle: "monthly" | "annual" | null;
  lecture_level: "beginner" | "intermediate" | "advanced" | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileLite | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadProfile = async (uid: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url, account_state, membership_level, chess_rating, onboarding_completed, onboarding_step, membership_type, billing_cycle, lecture_level").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((profileRes.data as ProfileLite | null) ?? null);
    setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer DB call to avoid blocking the auth callback
        setTimeout(() => {
          void loadProfile(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
      router.invalidate();
      queryClient.invalidateQueries();
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    profile,
    roles,
    loading,
    isAuthenticated: !!session?.user,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (rs) => rs.some((r) => roles.includes(r)),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}