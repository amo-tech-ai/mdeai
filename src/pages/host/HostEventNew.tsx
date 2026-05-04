import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type EventBasicsInput,
  type TicketTierInput,
  type WizardStep,
  STEP_LABELS,
} from "@/types/event-wizard";
import {
  useEventDraft,
  usePublishEvent,
  useUpsertEventBasics,
  useUpsertEventTickets,
} from "@/hooks/host/useEventDraft";
import { Step1Basics } from "@/components/host/event-wizard/Step1Basics";
import { Step2Tickets } from "@/components/host/event-wizard/Step2Tickets";
import { Step3Review } from "@/components/host/event-wizard/Step3Review";
import { Step4Publish } from "@/components/host/event-wizard/Step4Publish";

/**
 * /host/event/new — Phase 1 organizer wizard (task 002).
 *
 * State machine:
 *   Step 1 (basics)  → upserts events row (status='draft'); URL gains ?draft=:id
 *   Step 2 (tickets) → replaces event_tickets rows for that draft
 *   Step 3 (review)  → read-only; jump-edit pencils per section
 *   Step 4 (publish) → slug gen + status='draft' → 'published'
 *
 * Auth gate (matches landlord pattern):
 *   anon → /login?returnTo=/host/event/new
 *   any signed-in user can author events for now (no role gating in P1)
 *
 * Resume:
 *   /host/event/new?draft=:id loads the draft into the form
 */
export default function HostEventNew() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftId = searchParams.get("draft");

  const { data: draft, isLoading: draftLoading, error: draftError } =
    useEventDraft(draftId);
  const upsertBasics = useUpsertEventBasics();
  const upsertTickets = useUpsertEventTickets();
  const publish = usePublishEvent();

  const [step, setStep] = useState<WizardStep>(1);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Local copies — needed because Step 2 replaces tickets via mutation; we
  // also keep them so Step 3 review renders without a refetch lag.
  const [basicsLocal, setBasicsLocal] = useState<Partial<EventBasicsInput> | undefined>();
  const [ticketsLocal, setTicketsLocal] = useState<TicketTierInput[]>([]);

  // Hydrate local state once a draft loads
  useEffect(() => {
    if (!draft) return;
    setBasicsLocal(draft.basics);
    setTicketsLocal(draft.tickets);
  }, [draft]);

  const handleStep1Submit = (values: EventBasicsInput) => {
    upsertBasics.mutate(
      { draftId, basics: values },
      {
        onSuccess: ({ id }) => {
          setBasicsLocal(values);
          if (!draftId) {
            setSearchParams({ draft: id }, { replace: true });
          }
          setStep(2);
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Couldn't save basics",
            description: err.message,
          });
        },
      },
    );
  };

  const handleStep2Submit = (values: { tickets: TicketTierInput[] }) => {
    if (!draftId) {
      toast({
        variant: "destructive",
        title: "No draft yet",
        description: "Go back to Step 1 and save it first.",
      });
      return;
    }
    upsertTickets.mutate(
      { draftId, tickets: values.tickets },
      {
        onSuccess: () => {
          setTicketsLocal(values.tickets);
          setStep(3);
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Couldn't save tickets",
            description: err.message,
          });
        },
      },
    );
  };

  const handlePublish = () => {
    if (!draftId || !basicsLocal?.name) return;
    publish.mutate(
      { draftId, name: basicsLocal.name },
      {
        onSuccess: ({ slug }) => {
          setPublishedSlug(slug);
          toast({
            title: "Published",
            description: `mdeai.co/event/${slug}`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Publish failed",
            description: err.message,
          });
        },
      },
    );
  };

  // Auth + loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-6 h-6 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?returnTo=%2Fhost%2Fevent%2Fnew" replace />;
  }

  // Draft load error
  if (draftId && draftError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <h1 className="text-lg font-semibold text-destructive">
            Couldn't load draft
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {draftError.message}
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link to="/host/event/new">Start fresh</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Draft is loading
  if (draftId && draftLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-6 h-6 animate-spin text-muted-foreground"
          aria-label="Loading draft"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/host/dashboard">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </Button>
          <div className="flex-1" />
          <p className="text-xs text-muted-foreground">
            Step {step} of 4 · {STEP_LABELS[step]}
          </p>
        </div>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Create an event</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build a public event listing with paid ticket tiers in 4 steps.
          </p>
        </header>

        <Stepper current={step} onJump={setStep} />

        <main className="mt-6">
          {step === 1 && (
            <Step1Basics
              defaults={basicsLocal}
              saving={upsertBasics.isPending}
              onSubmit={handleStep1Submit}
            />
          )}
          {step === 2 && (
            <Step2Tickets
              defaults={ticketsLocal}
              saving={upsertTickets.isPending}
              onBack={() => setStep(1)}
              onSubmit={handleStep2Submit}
            />
          )}
          {step === 3 && (
            <Step3Review
              basics={basicsLocal ?? {}}
              tickets={ticketsLocal}
              saving={false}
              onBack={() => setStep(2)}
              onEditStep={(s) => setStep(s)}
              onContinue={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4Publish
              draftId={draftId}
              publishedSlug={publishedSlug}
              publishing={publish.isPending}
              publishError={publish.error?.message ?? null}
              onBack={() => setStep(3)}
              onPublish={handlePublish}
            />
          )}
        </main>
      </div>
    </div>
  );
}

interface StepperProps {
  current: WizardStep;
  onJump: (step: WizardStep) => void;
}

function Stepper({ current, onJump }: StepperProps) {
  // Memoize the step ids so the array reference is stable for the map below
  const steps: WizardStep[] = useMemo(() => [1, 2, 3, 4], []);

  return (
    <nav aria-label="Wizard progress">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s) => {
          const done = s < current;
          const active = s === current;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => (done ? onJump(s) : undefined)}
                disabled={!done}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left transition-colors",
                  active && "border-primary bg-primary/5",
                  done && "border-emerald-500/40 bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer",
                  !active && !done && "border-muted bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-emerald-500 text-white",
                      !active && !done && "bg-muted-foreground/20",
                    )}
                  >
                    {done ? <Check className="w-3 h-3" /> : s}
                  </span>
                  <span className="text-xs font-medium hidden sm:inline">
                    {STEP_LABELS[s]}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
