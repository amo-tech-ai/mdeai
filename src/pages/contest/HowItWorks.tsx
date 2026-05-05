import { useParams, Link } from "react-router-dom";
import { ShieldCheck, BarChart3, Scale, Lock } from "lucide-react";
import { useContestBySlug } from "@/hooks/useContestBySlug";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormulaBar {
  label: string;
  key: string;
  pct: number;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPercent(value: number): number {
  // Accept both 0–1 fractions and 0–100 integers
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

const FORMULA_COLORS: Record<string, string> = {
  audience: "bg-emerald-500",
  judges: "bg-blue-500",
  engagement: "bg-violet-500",
};

const FORMULA_LABELS: Record<string, string> = {
  audience: "Public Vote",
  judges: "Judges Panel",
  engagement: "Engagement Bonus",
};

function buildFormulaBars(
  formula: Record<string, number>,
): FormulaBar[] {
  return Object.entries(formula).map(([key, value]) => ({
    key,
    label: FORMULA_LABELS[key] ?? key,
    pct: toPercent(value),
    color: FORMULA_COLORS[key] ?? "bg-muted-foreground",
  }));
}

// ─── Section heading ──────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-foreground font-display">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Score formula section ────────────────────────────────────────────────────

interface ScoringFormulaProps {
  formula: Record<string, number>;
}

function ScoringFormulaDisplay({ formula }: ScoringFormulaProps) {
  const bars = buildFormulaBars(formula);

  return (
    <div className="space-y-3">
      {bars.map((bar) => (
        <div key={bar.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{bar.label}</span>
            <span className="text-muted-foreground font-mono">{bar.pct}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", bar.color)}
              style={{ width: `${bar.pct}%` }}
              role="progressbar"
              aria-valuenow={bar.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={bar.label}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-muted-foreground pt-1">
        These weights combine into a single weighted total that determines the final ranking.
        A contestant with fewer votes but higher judge scores can outrank one who received
        more public votes.
      </p>
    </div>
  );
}

// ─── Fraud prevention bullet ──────────────────────────────────────────────────

interface FraudLayerProps {
  index: number;
  title: string;
  description: string;
}

function FraudLayer({ index, title, description }: FraudLayerProps) {
  return (
    <li className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </li>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContestHowItWorks() {
  const { slug } = useParams<{ slug: string }>();
  const { data: contest, isLoading, error } = useContestBySlug(slug);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-destructive font-medium mb-2">Contest not found</p>
        <p className="text-sm text-muted-foreground">
          The contest at{" "}
          <code className="font-mono text-xs">/vote/{slug}</code> could not be loaded.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Return home
        </Link>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">No contest data available.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Page hero */}
      <div className="border-b bg-muted/30 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide font-medium">
            {contest.title}
          </p>
          <h1 className="text-3xl font-bold text-foreground font-display">
            How It Works
          </h1>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know about voting, fairness, and your data.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-12">
        {/* Section 1: Scoring formula */}
        <Section
          icon={<BarChart3 className="w-5 h-5" />}
          title="How your vote counts"
        >
          <p className="text-sm text-muted-foreground">
            Every vote is weighted according to the formula below. Public votes matter, but
            they share the final score with a panel of expert judges and a bonus for genuine
            community engagement (shares, referrals, and organic reach).
          </p>
          <ScoringFormulaDisplay formula={contest.scoring_formula} />
          <p className="text-sm text-muted-foreground">
            You have{" "}
            <strong className="text-foreground">
              {contest.free_votes_per_user_per_day} free vote
              {contest.free_votes_per_user_per_day !== 1 ? "s" : ""}
            </strong>{" "}
            per day. Votes are verified by phone OTP so each person can only vote once per day
            per device.
          </p>
        </Section>

        {/* Section 2: Fraud prevention */}
        <Section
          icon={<ShieldCheck className="w-5 h-5" />}
          title="How we prevent fraud"
        >
          <p className="text-sm text-muted-foreground">
            Voting integrity is enforced by five independent layers. No single layer is
            breakable by a casual bad actor, and bypassing all five simultaneously is
            computationally infeasible.
          </p>
          <ol className="space-y-4 mt-2">
            <FraudLayer
              index={1}
              title="Rate limiting"
              description="Each phone number and IP address is limited to one vote per contestant per day. Exceeded limits result in a cooldown period, not a silent discard."
            />
            <FraudLayer
              index={2}
              title="Device fingerprint"
              description="A browser fingerprint is generated from device characteristics. Multiple accounts voting from the same device are flagged for review."
            />
            <FraudLayer
              index={3}
              title="IP analysis"
              description="Votes from the same IP subnet within a short window are weighted down automatically. Datacenter and VPN IP ranges are rejected outright."
            />
            <FraudLayer
              index={4}
              title="Turnstile CAPTCHA"
              description="Cloudflare Turnstile confirms the voter is human before the vote is counted. It runs invisibly for legitimate users and triggers a challenge for bots."
            />
            <FraudLayer
              index={5}
              title="AI anomaly detection"
              description="Every vote is scored by an AI model that looks for burst patterns, coordinated timing, and other signals of organised manipulation. Suspicious votes are held for manual review."
            />
          </ol>
        </Section>

        {/* Section 3: Skill-based competition */}
        <Section
          icon={<Scale className="w-5 h-5" />}
          title="Why this isn't a lottery"
        >
          <p className="text-sm text-muted-foreground">
            Under{" "}
            <strong className="text-foreground">Colombian law (Ley 643 of 2001)</strong>,
            contests that award prizes based purely on chance require a government gambling
            license. This contest is explicitly designed to avoid that classification.
          </p>
          <p className="text-sm text-muted-foreground">
            Winners are determined by a combination of public votes (weighted), judge panel
            scores (weighted), and measurable engagement metrics — all three of which reflect
            skill, talent, and community appeal rather than random chance. The judge panel
            component alone (
            <strong className="text-foreground">{contest.judge_weight_pct}%</strong>) is
            sufficient to classify this as a skill-based competition.
          </p>
          <p className="text-sm text-muted-foreground">
            This structure has been reviewed against the criteria established in Ley 643/2001
            and its regulatory decrees. If you have legal questions, contact the organiser
            directly.
          </p>
        </Section>

        {/* Section 4: Data & privacy */}
        <Section
          icon={<Lock className="w-5 h-5" />}
          title="Your data & privacy"
        >
          <p className="text-sm text-muted-foreground">
            Your personal data is processed in accordance with{" "}
            <strong className="text-foreground">
              Ley 1581 de 2012 (Habeas Data)
            </strong>
            , Colombia's statutory data-protection framework. Specifically:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>
              Your phone number is used only for vote verification. It is never shared with
              third parties or used for marketing without explicit consent.
            </li>
            <li>
              Voting records are retained for 90 days after the contest closes, then
              permanently deleted unless a fraud dispute requires longer retention.
            </li>
            <li>
              You may request access to, correction of, or deletion of your data at any time
              by contacting the organiser.
            </li>
            <li>
              Analytics and aggregated vote counts are published publicly on the leaderboard.
              Individual vote attribution is never public.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            For the full privacy policy, visit{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              mdeai.co/privacy
            </Link>
            .
          </p>
        </Section>

        {/* Back link */}
        <div className="pt-4 border-t">
          <Link
            to={`/vote/${slug}`}
            className="text-sm text-primary hover:underline"
          >
            Back to voting
          </Link>
        </div>
      </div>
    </main>
  );
}
