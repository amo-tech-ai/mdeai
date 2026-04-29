import { useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/posthog";
import {
  uploadListingPhoto,
  removeListingPhoto,
  ListingPhotoTooLargeError,
  ListingPhotoUnsupportedTypeError,
  LISTING_PHOTO_ACCEPTED_TYPES,
} from "@/lib/storage/upload-listing-photo";
import type { ListingDraftPhoto } from "@/hooks/host/useListingDraft";

/**
 * Step 3 — Photos. Multi-image upload to the public listing-photos bucket.
 *
 * UX rules (matched to the auto-moderation rule in plan §3.1):
 *   - Minimum 5 photos required to advance (auto-moderation passes 5+).
 *   - First photo is the cover (visually flagged).
 *   - Reorder via simple swap-to-front; full DnD lands later if needed.
 *   - Delete removes from storage AND from the draft list.
 *
 * Concurrency:
 *   - Uploads run sequentially (Promise.all would race against the
 *     bucket file_size_limit on slow links). One progress indicator at
 *     a time keeps the UX legible.
 */

interface Step3PhotosProps {
  draftId: string;
  value: ListingDraftPhoto[];
  onChange: (next: ListingDraftPhoto[]) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const MIN_PHOTOS = 5;
const ACCEPT_ATTR = LISTING_PHOTO_ACCEPTED_TYPES.join(",");

export function Step3Photos({
  draftId,
  value,
  onChange,
  onSubmit,
  onBack,
}: Step3PhotosProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || !user) return;
    setUploading(true);
    const next: ListingDraftPhoto[] = [...value];
    for (const file of Array.from(files)) {
      try {
        const photo = await uploadListingPhoto({
          userId: user.id,
          draftId,
          file,
        });
        next.push(photo);
        onChange([...next]);
        trackEvent({
          name: "listing_photo_uploaded",
          sizeBytes: photo.sizeBytes,
          totalCount: next.length,
        });
      } catch (err) {
        if (
          err instanceof ListingPhotoTooLargeError ||
          err instanceof ListingPhotoUnsupportedTypeError
        ) {
          setError(err.message);
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          setError(`Upload failed: ${msg}`);
        }
        break;
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = async (idx: number) => {
    const photo = value[idx];
    if (!photo) return;
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    // Fire-and-forget storage delete (errors logged inside the helper).
    void removeListingPhoto(photo.path);
  };

  const promoteToCover = (idx: number) => {
    if (idx === 0) return;
    const next = [value[idx], ...value.filter((_, i) => i !== idx)];
    onChange(next);
  };

  const submitDisabled = value.length < MIN_PHOTOS || uploading;

  return (
    <div className="space-y-6" data-testid="step3-photos-form">
      <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Add at least <strong>{MIN_PHOTOS} photos</strong>. The first is your
        cover image — pick a wide shot of the main living area or façade.
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
        data-testid="step3-file-input"
      />

      {value.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed border-border bg-card px-4 py-12 text-center"
          data-testid="step3-empty"
        >
          <ImagePlus
            className="w-10 h-10 mx-auto text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            JPEG · PNG · WebP — up to 5 MB each
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="step3-upload-btn"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" /> Upload photos
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div
            className="grid gap-3 grid-cols-2 sm:grid-cols-3"
            data-testid="step3-photo-grid"
          >
            {value.map((photo, idx) => (
              <div
                key={photo.path}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                  idx === 0
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border",
                )}
                data-testid={`step3-photo-${idx}`}
              >
                <img
                  src={photo.publicUrl}
                  alt={`Listing photo ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {idx === 0 ? (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    <Star className="w-3 h-3" aria-hidden="true" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => promoteToCover(idx)}
                    className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 hover:bg-background transition"
                    data-testid={`step3-make-cover-${idx}`}
                  >
                    <GripVertical className="w-3 h-3" /> Make cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur text-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition"
                  aria-label={`Remove photo ${idx + 1}`}
                  data-testid={`step3-remove-${idx}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              data-testid="step3-add-more-btn"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Add more</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="step3-counter">
            {value.length} / {MIN_PHOTOS} required ·{" "}
            {value.length >= MIN_PHOTOS ? (
              <span className="text-primary font-medium">Ready to continue</span>
            ) : (
              <span>Add {MIN_PHOTOS - value.length} more</span>
            )}
          </p>
        </>
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="flex-1"
          onClick={onBack}
          data-testid="step3-back"
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={onSubmit}
          disabled={submitDisabled}
          data-testid="step3-submit"
        >
          Continue to description
        </Button>
      </div>
    </div>
  );
}
