import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, type AccountType } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AccountTypeStep } from "@/components/auth/AccountTypeStep";
import { trackEvent } from "@/lib/posthog";

export default function Signup() {
  // Three-step signup flow:
  //   1. AccountTypeStep — pick "renter" or "landlord". Persists to
  //      auth.users metadata so the post-confirmation redirect knows where
  //      to land the user (renter -> /, landlord -> /host/onboarding).
  //   2. Email/password or Google OAuth.
  //   3. SignupSuccess — inline "check your inbox" panel. Replaces the
  //      old toast+navigate-to-/login pattern that landed the user on a
  //      "Welcome back" screen with no explanation. (Bug found 2026-05-02
  //      QA: ~50% of new landlords would think signup failed.)
  // The chosen type is also surfaced in the form header so the user knows
  // what they're signing up for.
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Set to true after a successful signUp() call. Triggers the inline
  // success surface instead of navigating away to /login.
  const [signupComplete, setSignupComplete] = useState(false);

  const { signUp, signInWithGoogle } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const handleAccountTypeSelect = (next: AccountType) => {
    setAccountType(next);
    if (next === "landlord") {
      trackEvent({ name: "landlord_signup_started", from: "signup_page" });
    }
  };

  // Same `returnTo` precedence as Login. Used for:
  //   - Google OAuth redirectTo (so user lands on /chat?send=pending
  //     directly after the round-trip)
  //   - the `?returnTo=…` carry-over to /login after email confirmation
  // Same-origin paths only — never honor an absolute external URL.
  const params = new URLSearchParams(location.search);
  const rawReturn = params.get("returnTo");
  const returnTo =
    rawReturn && rawReturn.startsWith("/") && !rawReturn.startsWith("//")
      ? rawReturn
      : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, {
      accountType: accountType ?? "renter",
    });

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      if (accountType === "landlord") {
        trackEvent({ name: "landlord_signup_completed", method: "email" });
      }
      // Show inline "check your inbox" surface instead of navigating to
      // /login. The old behavior dropped users on a "Welcome back" page
      // with no explanation — most thought signup failed (P0 bug found
      // in QA 2026-05-02).
      setSignupComplete(true);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    if (accountType === "landlord") {
      trackEvent({ name: "landlord_signup_completed", method: "google" });
    }
    // Google round-trips through Supabase and lands on `redirectTo`. For
    // landlords this is forced to /host/onboarding inside signInWithGoogle
    // so the OAuth flow can't accidentally drop them on /chat.
    const { error } = await signInWithGoogle(returnTo, {
      accountType: accountType ?? "renter",
    });
    if (error) {
      toast({
        title: "Google signup failed",
        description: error.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Step 1 — pick account type. AccountTypeStep is its own full-screen
  // surface; we render nothing else around it. After selection, fall
  // through to the email/Google form below.
  if (accountType === null) {
    return <AccountTypeStep onSelect={handleAccountTypeSelect} />;
  }

  const isLandlord = accountType === "landlord";

  // Step 3 — success surface. Renders in place after signUp() succeeds.
  // Tells the user EXACTLY what happened, what to do next, and gives them
  // a path to /login that doesn't look like an error. Replaces the old
  // toast+navigate pattern that confused everyone (P0 fix 2026-05-02).
  if (signupComplete) {
    const loginTarget =
      returnTo && returnTo !== "/"
        ? `/login?returnTo=${encodeURIComponent(returnTo)}`
        : "/login";
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-16">
          <div className="max-w-md text-center flex flex-col items-center">
            <BrandLogo variant="panel" />
            <h2 className="font-display text-3xl font-bold text-primary-foreground mt-8">
              {isLandlord ? "Welcome to mdeai." : "You're almost in."}
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              {isLandlord
                ? "One click in your email and you're ready to list your first property."
                : "Confirm your email and start exploring Medellín."}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <div
            className="max-w-md w-full mx-auto text-center"
            data-testid="signup-success-panel"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2
                className="h-10 w-10 text-primary"
                aria-hidden="true"
              />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Check your inbox
            </h1>
            <p className="mt-3 text-muted-foreground">
              We sent a confirmation link to
            </p>
            <p
              className="mt-1 font-medium text-foreground break-all"
              data-testid="signup-success-email"
            >
              {email}
            </p>
            <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                What happens next:
              </p>
              <ol className="space-y-1 list-decimal pl-4">
                <li>Open the email from mdeai</li>
                <li>Click the confirmation link</li>
                <li>
                  {isLandlord
                    ? "You'll land on host onboarding to list your first property"
                    : "You'll land back here to start exploring"}
                </li>
              </ol>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => {
                  setSignupComplete(false);
                  setLoading(false);
                }}
                className="text-primary hover:underline"
                data-testid="signup-success-edit-email"
              >
                use a different email
              </button>
              .
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full h-12">
                <Link to={loginTarget} data-testid="signup-success-signin">
                  I've confirmed — sign in
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const headlineCopy = isLandlord
    ? "List your first property"
    : "Create your account";
  const subhead = isLandlord
    ? "Set up your host account in 3 minutes. Free for the first 100 landlords."
    : "Start exploring Medellín like a local.";
  const heroTitle = isLandlord ? "Join the Founding Beta" : "Join the Community";
  const heroBlurb = isLandlord
    ? "First 100 landlords get permanent free access. Renter inquiries land directly in your WhatsApp."
    : "Create an account to save your favorite places and get personalized recommendations.";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-16">
        <div className="max-w-md text-center flex flex-col items-center">
          <BrandLogo variant="panel" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground mt-8">
            {heroTitle}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{heroBlurb}</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <button
            type="button"
            onClick={() => setAccountType(null)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Change account type
          </button>

          <div className="mb-8">
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-primary uppercase tracking-wider mb-2"
              data-testid="signup-account-type-badge"
            >
              {isLandlord ? "Landlord / Agent" : "Renter"}
            </span>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {headlineCopy}
            </h1>
            <p className="mt-2 text-muted-foreground">{subhead}</p>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
