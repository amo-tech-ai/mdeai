/**
 * StepPhotos — Paso 2: 3 slots de foto (hero obligatoria; photo2, photo3 opcionales).
 * Muestra advertencia de moderación si verdict !== "approved".
 */
import { useRef, useState } from "react";
import { Camera, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn }       from "@/lib/utils";
import type { ContestApplyDraft, ModerationResult } from "@/types/contestApply";
import type { Contest } from "@/hooks/useContest";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

interface PhotoSlotConfig {
  key:      "hero" | "photo2" | "photo3";
  label:    string;
  required: boolean;
}

const SLOTS: PhotoSlotConfig[] = [
  { key: "hero",   label: "Foto principal",   required: true  },
  { key: "photo2", label: "Foto 2 (opcional)", required: false },
  { key: "photo3", label: "Foto 3 (opcional)", required: false },
];

interface StepPhotosProps {
  draft:        ContestApplyDraft | null;
  contest:      Contest;
  onUpload:     (
    file:    File,
    slot:    "hero" | "photo2" | "photo3",
    contest: Contest,
  ) => Promise<{ url: string; moderation: ModerationResult }>;
  onNext:       () => void;
  onBack:       () => void;
}

interface SlotState {
  preview:     string | null;
  uploading:   boolean;
  progress:    number;
  moderation:  ModerationResult | null;
  error:       string | null;
}

type SlotsState = Record<"hero" | "photo2" | "photo3", SlotState>;

function initialSlot(): SlotState {
  return { preview: null, uploading: false, progress: 0, moderation: null, error: null };
}

export function StepPhotos({ draft, contest, onUpload, onNext, onBack }: StepPhotosProps) {
  const [slots, setSlots] = useState<SlotsState>({
    hero:   initialSlot(),
    photo2: initialSlot(),
    photo3: initialSlot(),
  });

  const heroRef   = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const photo3Ref = useRef<HTMLInputElement>(null);
  const refs = { hero: heroRef, photo2: photo2Ref, photo3: photo3Ref };

  const patchSlot = (key: "hero" | "photo2" | "photo3", patch: Partial<SlotState>) =>
    setSlots((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleFile = async (key: "hero" | "photo2" | "photo3", file: File) => {
    if (file.size > MAX_PHOTO_BYTES) {
      patchSlot(key, { error: "La foto no puede superar 10 MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      patchSlot(key, { error: "Solo se aceptan archivos de imagen" });
      return;
    }

    const preview = URL.createObjectURL(file);
    patchSlot(key, { preview, uploading: true, progress: 10, error: null });

    try {
      // Simulate progress ticks while uploading
      const ticker = setInterval(() =>
        setSlots((prev) => ({
          ...prev,
          [key]: { ...prev[key], progress: Math.min(prev[key].progress + 15, 85) },
        })), 400);

      const { moderation } = await onUpload(file, key, contest);
      clearInterval(ticker);
      patchSlot(key, { uploading: false, progress: 100, moderation });
    } catch (err) {
      patchSlot(key, {
        uploading: false,
        progress:  0,
        error:     err instanceof Error ? err.message : "Error al subir la foto",
      });
    }
  };

  const heroUploaded = slots.hero.preview !== null || draft?.hero_url !== null;
  const canContinue  = heroUploaded && !slots.hero.uploading && !slots.photo2.uploading && !slots.photo3.uploading;

  return (
    <div className="space-y-6">
      {SLOTS.map(({ key, label, required }) => {
        const slot        = slots[key];
        const existingUrl = draft?.[`${key}_url` as "hero_url" | "photo2_url" | "photo3_url"];
        const hasPicture  = slot.preview || existingUrl;
        const mod         = slot.moderation ?? draft?.[`${key}_moderation` as "hero_moderation" | "photo2_moderation" | "photo3_moderation"];

        return (
          <div key={key} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </p>
              {hasPicture && !slot.uploading && (
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => patchSlot(key, initialSlot())}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Preview */}
            {hasPicture ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={slot.preview ?? (existingUrl ? `${existingUrl}` : undefined)}
                  alt={label}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => refs[key].current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2",
                  "w-full aspect-[4/3] rounded-lg border-2 border-dashed",
                  "text-muted-foreground hover:border-primary hover:text-primary transition-colors",
                )}
              >
                <Camera className="w-8 h-8" />
                <span className="text-xs">Toca para seleccionar o tomar foto</span>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={refs[key]}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(key, file);
              }}
            />

            {/* Upload progress */}
            {slot.uploading && (
              <div className="space-y-1">
                <Progress value={slot.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Subiendo y moderando foto…
                </p>
              </div>
            )}

            {/* Moderation result */}
            {mod && !slot.uploading && (
              <ModerationBadge verdict={mod.verdict} reasons={mod.reasons} />
            )}

            {/* File error */}
            {slot.error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {slot.error}
              </p>
            )}

            {hasPicture && !slot.uploading && !slot.error && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => refs[key].current?.click()}
              >
                Cambiar foto
              </Button>
            )}
          </div>
        );
      })}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button type="button" disabled={!canContinue} onClick={onNext} className="min-w-32">
          Continuar
        </Button>
      </div>
    </div>
  );
}

// ─── ModerationBadge ─────────────────────────────────────────────────────────

interface ModerationBadgeProps {
  verdict: ModerationResult["verdict"];
  reasons: string[];
}

function ModerationBadge({ verdict, reasons }: ModerationBadgeProps) {
  if (verdict === "approved") {
    return (
      <p className="text-sm text-emerald-600 flex items-center gap-1.5" data-testid="moderation-approved">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        Foto aprobada
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-1",
        verdict === "rejected"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-amber-400/40 bg-amber-50 text-amber-700",
      )}
      data-testid="moderation-warning"
    >
      <p className="text-sm font-medium flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {verdict === "rejected" ? "Foto rechazada" : "Foto en revisión"}
      </p>
      {reasons.length > 0 && (
        <ul className="text-xs list-disc list-inside space-y-0.5">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <p className="text-xs">
        {verdict === "rejected"
          ? "Por favor sube una foto diferente para continuar."
          : "Un administrador revisará esta foto antes de publicarla."}
      </p>
    </div>
  );
}
