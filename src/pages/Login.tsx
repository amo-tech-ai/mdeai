import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // `returnTo` precedence:
  //   1. ?returnTo=… query string (set by HeroChatPrompt after savePendingPrompt)
  //   2. ProtectedRoute's location.state.from.pathname (existing path)
  //   3. account-type default: landlord -> /host/dashboard, renter -> "/"
  // Same-origin paths only — never honor an absolute external URL (open-redirect).
  // The account-type default replaces the old "everyone goes to /" rule that
  // dropped freshly-signed-in landlords on the chat home with no signal that
  // their host dashboard existed (P1 bug found in QA 2026-05-02).
  const params = new URLSearchParams(location.search);
  const rawReturn = params.get("returnTo");
  const explicitReturn =
    rawReturn && rawReturn.startsWith("/") && !rawReturn.startsWith("//")
      ? rawReturn
      : (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      // Resolve destination AFTER signIn succeeds so we can read the
      // freshly-set account_type metadata. Explicit ?returnTo always wins
      // (deep-link / pending-prompt flows must land where they were going).
      // Otherwise route by account type so landlords land on their host
      // dashboard, not the renter chat home.
      let destination = explicitReturn ?? "/";
      if (!explicitReturn) {
        const { data } = await supabase.auth.getUser();
        const accountType = data.user?.user_metadata?.account_type;
        if (accountType === "landlord") {
          destination = "/host/dashboard";
        }
      }
      navigate(destination, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    // Google OAuth round-trips through Google then hits Supabase, then
    // returns the user to `redirectTo`. Pass our explicit returnTo so they
    // land directly on /chat?send=pending after auth. For Google login we
    // can't read account_type pre-redirect (no session yet), so we fall
    // back to "/" — the auth listener post-OAuth handles landlord routing
    // server-side via emailRedirectTo on signup.
    const { error } = await signInWithGoogle(explicitReturn ?? "/");
    if (error) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your saved places and personalized recommendations.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={handleGoogleLogin}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-16">
        <div className="max-w-md text-center flex flex-col items-center">
          <BrandLogo variant="panel" />
          <p className="mt-8 text-primary-foreground/80">
            Discover the best stays, restaurants, events, and car rentals in the City of Eternal Spring.
          </p>
        </div>
      </div>
    </div>
  );
}
