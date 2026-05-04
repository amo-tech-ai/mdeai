/**
 * CompletenessMeter — muestra el progreso global del formulario de inscripción.
 * Calcula 0-100 % basado en los campos completados del draft.
 */
import { Progress } from "@/components/ui/progress";
import type { ContestApplyDraft } from "@/types/contestApply";

interface CompletenessMeterProps {
  draft: ContestApplyDraft | null;
}

interface CheckResult {
  pct:     number;
  missing: string[];
}

function computeCompleteness(draft: ContestApplyDraft | null): CheckResult {
  if (!draft) return { pct: 0, missing: ["perfil", "fotos", "documentos", "waiver", "consentimiento"] };

  const checks: Array<{ label: string; done: boolean }> = [
    { label: "perfil",          done: !!draft.display_name && !!draft.bio },
    { label: "foto principal",  done: !!draft.hero_url },
    { label: "documentos",      done: !!draft.id_front_url && !!draft.id_back_url },
    { label: "waiver",          done: !!draft.waiver_url },
    { label: "consentimiento",  done: draft.habeas_data && draft.image_rights },
  ];

  const done    = checks.filter((c) => c.done).length;
  const total   = checks.length;
  const pct     = Math.round((done / total) * 100);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);

  return { pct, missing };
}

export function CompletenessMeter({ draft }: CompletenessMeterProps) {
  const { pct, missing } = computeCompleteness(draft);

  return (
    <div className="space-y-1.5" data-testid="completeness-meter">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{pct}% completado</span>
        {missing.length > 0 && (
          <span className="text-muted-foreground">
            Falta: {missing.join(" · ")}
          </span>
        )}
      </div>
      <Progress
        value={pct}
        className="h-2"
        aria-label={`Progreso de la solicitud: ${pct}%`}
      />
    </div>
  );
}
