import { ArrowLeft, Building2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";

export type AccountType = "renter" | "landlord";

interface AccountTypeStepProps {
  onSelect: (accountType: AccountType) => void;
}

interface OptionConfig {
  type: AccountType;
  icon: typeof Search;
  title: string;
  description: string;
  cta: string;
}

const OPTIONS: readonly OptionConfig[] = [
  {
    type: "renter",
    icon: Search,
    title: "I'm looking for a place",
    description:
      "Search apartments and connect with hosts in Medellín. Free forever.",
    cta: "Find a rental",
  },
  {
    type: "landlord",
    icon: Building2,
    title: "I'm a landlord or agent",
    description:
      "List your property. Get renter inquiries direct to your WhatsApp. Founding-beta access — free for the first 100 hosts.",
    cta: "List my property",
  },
] as const;

export function AccountTypeStep({ onSelect }: AccountTypeStepProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10 sm:px-10 sm:py-16">
      <div className="max-w-3xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-10">
          <BrandLogo variant="header" />
        </div>

        <header className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            How will you use mdeai?
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl">
            Pick the option that fits — you can change it later from your
            profile.
          </p>
        </header>

        <div
          role="radiogroup"
          aria-label="Account type"
          className="grid gap-4 sm:grid-cols-2"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                role="radio"
                aria-checked={false}
                data-account-type={opt.type}
                onClick={() => onSelect(opt.type)}
                className={cn(
                  "group flex flex-col items-start text-left",
                  "rounded-2xl border-2 border-border bg-card p-6",
                  "transition-all hover:border-primary hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  "min-h-[220px]",
                )}
              >
                <span
                  className={cn(
                    "flex w-12 h-12 items-center justify-center rounded-xl",
                    "bg-primary/10 text-primary mb-4",
                    "transition-transform group-hover:scale-110",
                  )}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {opt.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground flex-1">
                  {opt.description}
                </p>
                <span className="mt-4 text-sm font-medium text-primary group-hover:underline">
                  {opt.cta} →
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
