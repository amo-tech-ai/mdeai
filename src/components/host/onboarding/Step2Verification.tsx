import { useRef, useState } from "react";
import { FileText, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DocKind } from "@/hooks/host/useLandlordOnboarding";

const DOC_OPTIONS: ReadonlyArray<{ value: DocKind; label: string; description: string }> = [
  {
    value: "national_id",
    label: "National ID (cédula)",
    description: "Front + back, clear photo",
  },
  {
    value: "passport",
    label: "Passport",
    description: "Photo page only",
  },
  {
    value: "rut",
    label: "RUT (tax registration)",
    description: "For agents and property managers",
  },
  {
    value: "property_deed",
    label: "Property deed",
    description: "Proves you own the property",
  },
  {
    value: "utility_bill",
    label: "Utility bill",
    description: "Recent — proves your address",
  },
];

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

interface Step2VerificationProps {
  onSubmit: (input: { docKind: DocKind; file: File }) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
}

export function Step2Verification({
  onSubmit,
  onSkip,
  isSubmitting,
  errorMessage,
  successMessage,
}: Step2VerificationProps) {
  const [docKind, setDocKind] = useState<DocKind>("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const next = e.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setLocalError("File is over 10 MB. Compress and try again.");
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(next.type)) {
      setLocalError(
        "We accept JPEG, PNG, WebP, or PDF. Pick one of those formats.",
      );
      setFile(null);
      return;
    }
    setFile(next);
  };

  const handleSubmit = () => {
    if (!file) {
      setLocalError("Pick a file first, or use Skip for now.");
      return;
    }
    onSubmit({ docKind, file });
  };

  const displayedError = localError ?? errorMessage ?? null;

  return (
    <div className="space-y-6" data-testid="step2-form">
      <div className="rounded-xl bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
        Verifying gives you a <strong>verified host badge</strong> on your
        public profile. It&rsquo;s optional in V1 — your listings will go
        live either way.
      </div>

      <div className="space-y-3">
        <Label htmlFor="doc-kind">Document type</Label>
        <Select
          value={docKind}
          onValueChange={(v) => setDocKind(v as DocKind)}
        >
          <SelectTrigger id="doc-kind" data-testid="step2-doc-kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "rounded-xl border-2 border-dashed border-border bg-card",
          "px-4 py-6 text-center",
          file ? "border-primary/50 bg-primary/5" : null,
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="sr-only"
          data-testid="step2-file-input"
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2
              className="w-8 h-8 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB · {file.type}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Pick a different file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileText
              className="w-8 h-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              JPEG · PNG · WebP · PDF — up to 10 MB
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" /> Choose file
            </Button>
          </div>
        )}
      </div>

      {displayedError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {displayedError}
        </div>
      ) : null}
      {successMessage ? (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="sm:flex-1"
          onClick={onSkip}
          disabled={isSubmitting}
          data-testid="step2-skip"
        >
          Skip for now
        </Button>
        <Button
          type="button"
          size="lg"
          className="sm:flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting || !file}
          data-testid="step2-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading…
            </>
          ) : (
            "Submit & continue"
          )}
        </Button>
      </div>
    </div>
  );
}
