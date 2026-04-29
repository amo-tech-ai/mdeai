import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser, resetPostHog } from "@/lib/posthog";

/**
 * Account type chosen on signup. Stored on `auth.users.raw_user_meta_data`
 * so it survives email confirmation + OAuth round-trips. Used by:
 *   - Signup post-confirmation redirect (renter -> /, landlord -> /host/onboarding)
 *   - Onboarding wizard (D3) to know whether to render renter or host flow
 *   - Server-side audit if we ever need to know intent at signup
 * Renters never see this — they pick "renter" on AccountTypeStep and continue
 * to the same chat experience as before.
 */
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // PostHog identity propagation. SIGNED_IN / SIGNED_UP attach
        // future events to a person profile keyed on user.id; SIGNED_OUT
        // resets so events don't leak across users on a shared device.
        // No-op when PostHog isn't initialized (silent in dev/preview).
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            identifyUser(session.user.id, {
              email: session.user.email,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          resetPostHog();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // First-load identify — for users already signed in when the
      // app boots (e.g. they refreshed the page mid-session).
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
    // Landlords land on /host/onboarding after confirming their email;
    // renters land on / (the existing chat home). The redirect URL is the
    // ONLY way to drive the post-confirmation destination — Supabase
    // ignores any client-side state once the email tab is opened.
    const redirectPath = accountType === "landlord" ? "/host/onboarding" : "/";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
        // Persisted in auth.users.raw_user_meta_data — survives email
        // confirmation + OAuth round-trips. The D3 onboarding wizard reads
        // this to gate the host vs renter flow.
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

  /**
   * Sign in via Google OAuth.
   *
   * `redirectTo` is the URL Supabase tells Google to send the user back to
   * after auth. Defaults to the app origin (root). Pass a path like
   * `/chat?send=pending` to land the user there post-auth — required for
   * the marketing-homepage prompt-handoff flow (see HeroChatPrompt +
   * pending-prompt.ts). Always converted to an absolute URL because
   * Google rejects relative redirectTo values.
   */
  const signInWithGoogle = async (
    redirectTo?: string,
    options?: SignUpOptions,
  ) => {
    // Landlord OAuth signup: override redirect to /host/onboarding so the
    // user lands on the wizard after the Google round-trip. Without this,
    // renter and landlord OAuth users land on the same /chat home.
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
        // OAuth metadata is set on first sign-in only; subsequent
        // sign-ins keep whatever was set the first time. Renters who later
        // become landlords update via /host/onboarding, not auth metadata.
        queryParams: accountType
          ? { account_type: accountType }
          : undefined,
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
