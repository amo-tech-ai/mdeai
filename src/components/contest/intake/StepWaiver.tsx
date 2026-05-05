/**
 * StepWaiver — Step 4: download waiver template and upload signed version.
 */
import { useRef, useState } from "react";
import { FileText, Download, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn }     from "@/lib/utils";
import type { ContestApplyDraft } from "@/types/contestApply";

const MAX_DOC_BYTES = 15 * 1024 * 1024;

interface StepWaiverProps {
  draft:         ContestApplyDraft | null;
  contestSlug:   string;
  onUploadWaiver: (file: File, contestSlug: string) => Promise<string>;
  onNext:        () => void;
  onBack:        () => void;
}

interface UploadState {
  fileName:  string | null;
  uploading: boolean;
  done:      boolean;
  error:     string | null;
}

export function StepWaiver({ draft, contestSlug, onUploadWaiver, onNext, onBack }: StepWaiverProps) {
  const [state, setState] = useState<UploadState>({
    fileName:  null,
    uploading: false,
    done:      false,
    error:     null,
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const isDone = state.done || !!draft?.waiver_url;

  const handleFile = async (file: File) => {
    if (file.size > MAX_DOC_BYTES) {
      setState((s) => ({ ...s, error: "File must be under 15 MB" }));
      return;
    }
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setState((s) => ({ ...s, error: "Only PDF or image of signed waiver accepted" }));
      return;
    }

    setState({ fileName: file.name, uploading: true, done: false, error: null });
    try {
      await onUploadWaiver(file, contestSlug);
      setState((s) => ({ ...s, uploading: false, done: true }));
    } catch (err) {
      setState({
        fileName:  null,
        uploading: false,
        done:      false,
        error:     err instanceof Error ? err.message : "Failed to upload waiver",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 shrink-0 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Participation authorization</p>
            <p className="text-xs text-muted-foreground mt-1">
              Download the authorization document, print or sign it digitally, then upload it here.
            </p>
          </div>
        </div>

        <a
          href="/waiver-template.pdf"
          download
          className={cn(
            "flex items-center justify-center gap-2 w-full rounded-lg border py-2.5 text-sm font-medium",
            "hover:bg-muted/50 transition-colors",
          )}
        >
          <Download className="w-4 h-4" />
          Download waiver (PDF)
        </a>
      </div>

      {/* Upload area */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">
          Signed waiver <span className="text-destructive">*</span>
        </p>

        {isDone ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600" data-testid="waiver-done">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {state.fileName ?? "Waiver uploaded"}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={state.uploading}
            className={cn(
              "flex flex-col items-center justify-center gap-2 w-full py-8 rounded-lg border-2 border-dashed",
              "text-muted-foreground hover:border-primary hover:text-primary transition-colors",
              state.uploading && "opacity-60 cursor-not-allowed",
            )}
          >
            {state.uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
            <span className="text-xs">
              {state.uploading ? "Uploading…" : "Tap to select the signed waiver"}
            </span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {state.error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {state.error}
          </p>
        )}

        {isDone && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setState({ fileName: null, uploading: false, done: false, error: null });
              fileRef.current?.click();
            }}
          >
            Replace waiver
          </Button>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!isDone || state.uploading} onClick={onNext} className="min-w-32">
          Continue
        </Button>
      </div>
    </div>
  );
}
