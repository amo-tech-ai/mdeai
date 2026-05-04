/**
 * StepIdDocs — Paso 3: cédula / documento de identidad (frente y reverso).
 * identity-docs bucket; RLS exige que el primer segmento de ruta sea auth.uid().
 */
import { useRef, useState } from "react";
import { ScanLine, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn }     from "@/lib/utils";
import type { ContestApplyDraft } from "@/types/contestApply";

const MAX_DOC_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface DocSlotConfig {
  key:   "id_front" | "id_back";
  label: string;
  hint:  string;
}

const DOC_SLOTS: DocSlotConfig[] = [
  { key: "id_front", label: "Frente del documento",  hint: "Foto clara del lado con tu fotografía" },
  { key: "id_back",  label: "Reverso del documento", hint: "Foto del lado con la firma o código de barras" },
];

interface SlotState {
  fileName:  string | null;
  uploading: boolean;
  done:      boolean;
  error:     string | null;
}

type SlotsState = Record<"id_front" | "id_back", SlotState>;

function initialSlot(): SlotState {
  return { fileName: null, uploading: false, done: false, error: null };
}

interface StepIdDocsProps {
  draft:        ContestApplyDraft | null;
  contestSlug:  string;
  onUploadDoc:  (file: File, docType: "id_front" | "id_back", contestSlug: string) => Promise<string>;
  onNext:       () => void;
  onBack:       () => void;
}

export function StepIdDocs({ draft, contestSlug, onUploadDoc, onNext, onBack }: StepIdDocsProps) {
  const [slots, setSlots] = useState<SlotsState>({
    id_front: initialSlot(),
    id_back:  initialSlot(),
  });

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef  = useRef<HTMLInputElement>(null);
  const refs     = { id_front: frontRef, id_back: backRef };

  const patchSlot = (key: "id_front" | "id_back", patch: Partial<SlotState>) =>
    setSlots((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleFile = async (key: "id_front" | "id_back", file: File) => {
    if (file.size > MAX_DOC_BYTES) {
      patchSlot(key, { error: "El archivo no puede superar 15 MB" });
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      patchSlot(key, { error: "Solo se aceptan imágenes (JPG, PNG) o PDF" });
      return;
    }

    patchSlot(key, { fileName: file.name, uploading: true, error: null, done: false });
    try {
      await onUploadDoc(file, key, contestSlug);
      patchSlot(key, { uploading: false, done: true });
    } catch (err) {
      patchSlot(key, {
        uploading: false,
        done:      false,
        error:     err instanceof Error ? err.message : "Error al subir el documento",
      });
    }
  };

  const frontDone = slots.id_front.done || !!draft?.id_front_url;
  const backDone  = slots.id_back.done  || !!draft?.id_back_url;
  const canContinue = frontDone && backDone && !slots.id_front.uploading && !slots.id_back.uploading;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-300/50 bg-amber-50/60 p-4 text-sm text-amber-800">
        <p className="font-medium">Privacidad de tus documentos</p>
        <p className="mt-1 text-xs">
          Tus documentos se almacenan de forma segura y solo los administradores del concurso tienen acceso. No se compartirán con terceros.
        </p>
      </div>

      {DOC_SLOTS.map(({ key, label, hint }) => {
        const slot    = slots[key];
        const already = draft?.[`${key}_url` as "id_front_url" | "id_back_url"];
        const isDone  = slot.done || !!already;

        return (
          <div key={key} className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{label} <span className="text-destructive">*</span></p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>

            {isDone && !slot.error ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600" data-testid={`${key}-done`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {slot.fileName ?? "Documento cargado"}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => refs[key].current?.click()}
                disabled={slot.uploading}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 w-full py-8 rounded-lg border-2 border-dashed",
                  "text-muted-foreground hover:border-primary hover:text-primary transition-colors",
                  slot.uploading && "opacity-60 cursor-not-allowed",
                )}
              >
                {slot.uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ScanLine className="w-6 h-6" />
                )}
                <span className="text-xs">
                  {slot.uploading ? "Subiendo…" : "Toca para seleccionar o tomar foto"}
                </span>
              </button>
            )}

            <input
              ref={refs[key]}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(key, file);
              }}
            />

            {slot.error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {slot.error}
              </p>
            )}

            {isDone && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  patchSlot(key, initialSlot());
                  refs[key].current?.click();
                }}
              >
                Reemplazar documento
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
