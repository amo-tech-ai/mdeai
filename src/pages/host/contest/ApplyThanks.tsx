/**
 * /host/contest/:slug/apply/thanks — Post-application confirmation screen.
 */
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplyThanks() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Success icon */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" aria-hidden />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold">
            Application submitted!
          </h1>
          <p className="text-muted-foreground text-sm">
            We're reviewing your information. Within{" "}
            <strong className="text-foreground">24–48 hours</strong> we'll notify
            you by WhatsApp or email with the result.
          </p>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border bg-card p-4 text-left space-y-3 text-sm">
          <p className="font-medium text-foreground">What happens next?</p>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Our team verifies your documents and photos.</li>
            <li>You receive a notification with the decision.</li>
            <li>If approved, your profile goes live in the contest.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {slug && (
            <Button asChild className="w-full">
              <Link to={`/vote/${slug}`}>View the contest</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">Go to my account</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Questions?{" "}
          <a
            href="mailto:hola@mdeai.co"
            className="underline underline-offset-4 text-primary"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
