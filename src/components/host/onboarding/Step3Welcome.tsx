import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step3WelcomeProps {
  displayName: string;
  verificationSubmitted: boolean;
}

export function Step3Welcome({
  displayName,
  verificationSubmitted,
}: Step3WelcomeProps) {
  const firstName = displayName.split(" ")[0] || displayName;
  return (
    <div className="text-center" data-testid="step3-welcome">
      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
      </div>

      <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
        Welcome aboard, {firstName}.
      </h2>

      <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
        You&rsquo;re part of the Founding Beta — free, permanently, for the
        first 100 hosts.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-xl mx-auto text-left">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Profile
          </p>
          <p className="mt-1 text-sm text-foreground">
            Your basics are saved. You can edit them any time from
            <span className="text-foreground font-medium"> /host/profile</span>.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Verification
          </p>
          <p className="mt-1 text-sm text-foreground">
            {verificationSubmitted
              ? "Document received. Founder typically reviews within 24 hours."
              : "Skipped for now. Verify any time to earn the badge."}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" data-testid="step3-cta-listing">
          <Link to="/host/listings/new">
            List your first property <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" data-testid="step3-cta-dashboard">
          <Link to="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Go to dashboard
          </Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Need help? WhatsApp the founder at{" "}
        <a
          href="https://wa.me/573000000000"
          className="text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          +57 300 000 0000
        </a>
        .
      </p>
    </div>
  );
}
