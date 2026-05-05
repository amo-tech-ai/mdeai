import { createContext, useContext, useEffect, useState, ReactNode, type Context } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser, resetPostHog } from "@/lib/posthog";

export type AccountType = "renter" | "landlord";

interface SignUpOptions {
  accountType?: AccountType;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (
    redirectTo?: string,
    options?: SignUpOptions,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

// Singleton guard: if HMR loads this module twice (two ?t= timestamps in the
// browser cache), both instances share the same context object via window.
// In production createContext runs once; the ?? assignment is a no-op.
const AuthContext: Context<AuthContextType | undefined> =
  (window as any).__mdeAuthContext ??
  ((window as any).__mdeAuthContext = createContext<AuthContextType | undefined>(undefined));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            identifyUser(session.user.id, { email: session.user.email });
          }
        } else if (event === 'SIGNED_OUT') {
          resetPostHog();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions,
  ) => {
    const accountType: AccountType = options?.accountType ?? "renter";
    const redirectPath = accountType === "landlord" ? "/host/onboarding" : "/";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
        data: { account_type: accountType },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (
    redirectTo?: string,
    options?: SignUpOptions,
  ) => {
    const accountType = options?.accountType;
    const effectiveRedirect =
      accountType === "landlord" ? "/host/onboarding" : redirectTo;
    const absolute =
      effectiveRedirect && effectiveRedirect.startsWith('/')
        ? `${window.location.origin}${effectiveRedirect}`
        : effectiveRedirect || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: absolute,
        queryParams: accountType ? { account_type: accountType } : undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
