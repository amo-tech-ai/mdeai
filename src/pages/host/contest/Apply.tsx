/**
 * /host/contest/:slug/apply — Formulario de inscripción de concursante (task 018).
 *
 * Flujo:
 *   Paso 1 (Bio)      → upsert vote.entities
 *   Paso 2 (Fotos)    → upload listing_photos + moderación
 *   Paso 3 (Docs)     → upload identity-docs (cédula frente + reverso)
 *   Paso 4 (Waiver)   → upload identity-docs (waiver firmado)
 *   Paso 5 (Consent)  → submit → redirect a /thanks
 *
 * Auth guard: anon → /login?returnTo=<ruta actual>
 * Contest guard: kind !== 'pageant' || status !== 'live' → pantalla "no disponible"
 */
import { Navigate, useParams } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth }           from "@/hooks/useAuth";
import { useContest }        from "@/hooks/useContest";
import { useContestApply }   from "@/hooks/useContestApply";
import { CompletenessMeter } from "@/components/contest/intake/CompletenessMeter";
import { StepBio }           from "@/components/contest/intake/StepBio";
import { StepPhotos }        from "@/components/contest/intake/StepPhotos";
import { StepIdDocs }        from "@/components/contest/intake/StepIdDocs";
import { StepWaiver }        from "@/components/contest/intake/StepWaiver";
import { StepConsent }       from "@/components/contest/intake/StepConsent";
import { cn }                from "@/lib/utils";
import type { StepBioData, StepConsentData } from "@/types/contestApply";

const STEP_LABELS: Record<number, string> = {
  1: "Profile",
  2: "Photos",
  3: "ID Docs",
  4: "Waiver",
  5: "Consent",
};

const TOTAL_STEPS = 5;

export default function Apply() {
  const { slug }       = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const {
    data:      contest,
    isLoading: contestLoading,
    error:     contestError,
  } = useContest(slug);

  const {
    draft,
    step,
    setStep,
    isLoading,
    saveBio,
    uploadPhoto,
    uploadIdDoc,
    uploadWaiver,
    submit,
  } = useContestApply(slug);

  // ── Auth loading ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=/host/contest/${slug}/apply`}
        replace
      />
    );
  }

  // ── Contest loading ────────────────────────────────────────────────────────
  if (contestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-label="Cargando concurso" />
      </div>
    );
  }

  // ── Contest not found / error ──────────────────────────────────────────────
  if (contestError || !contest) {
    return <ContestUnavailable reason="Concurso no encontrado" />;
  }

  // ── Contest guard: must be pageant + live ──────────────────────────────────
  if (contest.kind !== "pageant" || contest.status !== "live") {
    return <ContestUnavailable reason="Este concurso no está disponible para inscripciones en este momento." />;
  }

  // ── Step submit handlers ───────────────────────────────────────────────────

  const handleBioSubmit = async (data: StepBioData) => {
    try {
      await saveBio(data);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    }
  };

  const handleConsentSubmit = async (data: StepConsentData) => {
    if (!data.habeas_data || !data.image_rights) return;
    try {
      await submit(contest);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to={`/vote/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to contest
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
            {contest.title}
          </p>
          <h1 className="font-display text-2xl font-semibold">
            Contestant Application
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete all 5 steps to submit your application. You can resume where you left off.
          </p>
        </header>

        {/* Completeness meter */}
        <div className="mb-6">
          <CompletenessMeter draft={draft} />
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

        {/* Step content */}
        <main className="mt-6">
          {step === 1 && (
            <StepBio
              draft={draft}
              saving={isLoading}
              onSubmit={handleBioSubmit}
            />
          )}

          {step === 2 && (
            <StepPhotos
              draft={draft}
              contest={contest}
              onUpload={uploadPhoto}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && slug && (
            <StepIdDocs
              draft={draft}
              contestSlug={slug}
              onUploadDoc={uploadIdDoc}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && slug && (
            <StepWaiver
              draft={draft}
              contestSlug={slug}
              onUploadWaiver={uploadWaiver}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}

          {step === 5 && (
            <StepConsent
              submitting={isLoading}
              onSubmit={handleConsentSubmit}
              onBack={() => setStep(4)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: number;
  total:   number;
  labels:  Record<number, string>;
}

function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso del formulario">
      <ol className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => {
          const done   = s < current;
          const active = s === current;
          return (
            <li key={s} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  done   && "bg-emerald-500",
                  active && "bg-primary",
                  !done && !active && "bg-muted",
                )}
                aria-label={`Paso ${s}: ${labels[s]}${done ? " (completado)" : active ? " (actual)" : ""}`}
              />
              <p
                className={cn(
                  "mt-1 text-center text-[10px] truncate",
                  active ? "text-primary font-medium" : "text-muted-foreground",
                )}
              >
                {labels[s]}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── ContestUnavailable ───────────────────────────────────────────────────────

interface ContestUnavailableProps {
  reason: string;
}

function ContestUnavailable({ reason }: ContestUnavailableProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="text-4xl">🚫</div>
        <h1 className="font-display text-xl font-semibold">Contest unavailable</h1>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Link
          to="/events"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Browse events
        </Link>
      </div>
    </div>
  );
}
