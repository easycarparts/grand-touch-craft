import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, type AdminUserProfile } from "@/lib/supabase";

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
};

type AdminAuthContextValue = {
  session: Session | null;
  user: User | null;
  adminProfile: AdminUserProfile | null;
  bootstrapAvailable: boolean;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdminProfile: (userId?: string) => Promise<AdminUserProfile | null>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const loadAdminProfile = async (userId: string): Promise<AdminUserProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, is_active, last_login_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load admin profile", error);
    return null;
  }

  return (data as AdminUserProfile | null) ?? null;
};

const checkBootstrapAvailability = async () => {
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("can_bootstrap_admin");
  if (error) {
    console.warn("Failed to check admin bootstrap availability", error);
    return false;
  }

  return Boolean(data);
};

const bootstrapCurrentAdmin = async (fullName?: string) => {
  if (!supabase) return false;

  const { error } = await supabase.rpc("bootstrap_current_admin", {
    display_name: fullName ?? null,
  });

  if (error) {
    console.warn("Failed to bootstrap admin user", error);
    return false;
  }

  return true;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUserProfile | null>(null);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminProfile = useCallback(
    async (userId?: string) => {
      const targetUserId = userId ?? user?.id;
      if (!targetUserId) {
        setAdminProfile(null);
        return null;
      }

      let profile = await loadAdminProfile(targetUserId);
      const canBootstrap = await checkBootstrapAvailability();
      setBootstrapAvailable(canBootstrap);

      if (!profile && canBootstrap) {
        const fullName =
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          null;

        const bootstrapped = await bootstrapCurrentAdmin(fullName ?? undefined);
        if (bootstrapped) {
          profile = await loadAdminProfile(targetUserId);
          setBootstrapAvailable(false);
        }
      }

      if (profile) {
        setAdminProfile(profile);

        if (supabase) {
          const { error } = await supabase
            .from("admin_users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", targetUserId);

          if (error) {
            console.warn("Failed to update admin last login", error);
          }
        }
      } else {
        setAdminProfile(null);
      }

      return profile;
    },
    [user?.email, user?.id, user?.user_metadata?.full_name],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      const nextSession = data.session;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await refreshAdminProfile(nextSession.user.id);
      } else {
        setAdminProfile(null);
        setBootstrapAvailable(await checkBootstrapAvailability());
      }

      setLoading(false);
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      void (async () => {
        if (nextSession?.user) {
          await refreshAdminProfile(nextSession.user.id);
        } else {
          setAdminProfile(null);
          setBootstrapAvailable(await checkBootstrapAvailability());
        }
        setLoading(false);
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAdminProfile]);

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }: SignUpInput) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      user,
      adminProfile,
      bootstrapAvailable,
      loading,
      signIn,
      signUp,
      signOut,
      refreshAdminProfile,
    }),
    [
      adminProfile,
      bootstrapAvailable,
      loading,
      refreshAdminProfile,
      session,
      signIn,
      signOut,
      signUp,
      user,
    ],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
};
