import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a listing photo to the public `listing-photos` bucket.
 *
 * - Path convention: `<auth.uid()>/<draftId>/<timestamp>_<safe-name>`
 *   Folder is keyed by user_id (matches RLS) + draftId so a user can
 *   have multiple in-progress drafts without filename collisions.
 *
 * - Caller is responsible for client-side resize/compression. We trust
 *   the file as given but enforce a 5 MB ceiling that mirrors the
 *   bucket's `file_size_limit`. Going over 5 MB is rejected here so the
 *   user gets a friendly error instead of a confusing storage 413.
 *
 * - Returns the resolved public URL (anon SELECT is allowed via the
 *   `listing_photos_select_public` RLS policy).
 *
 * - On INSERT failure the orphan storage object is best-effort cleaned;
 *   a DELETE failure is logged but never thrown so the original error
 *   stays the error the caller sees.
 */

export const LISTING_PHOTO_BUCKET = "listing-photos" as const;

export const LISTING_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const LISTING_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export interface UploadedListingPhoto {
  /** Public URL anon renters can render in <img>. */
  publicUrl: string;
  /** Storage path including user_id prefix; useful for delete by path later. */
  path: string;
  /** Size of the uploaded blob in bytes (post-resize, if caller resized). */
  sizeBytes: number;
}

export interface UploadListingPhotoArgs {
  /** Authenticated user's id; folder name in storage. */
  userId: string;
  /** Per-listing draft id; sub-folder so multiple drafts don't collide. */
  draftId: string;
  /** The actual file. */
  file: File;
}

export class ListingPhotoTooLargeError extends Error {
  constructor(actualBytes: number) {
    super(
      `Image is ${(actualBytes / 1024 / 1024).toFixed(1)} MB. Listing photos must be 5 MB or smaller — try compressing or pick a smaller image.`,
    );
    this.name = "ListingPhotoTooLargeError";
  }
}

export class ListingPhotoUnsupportedTypeError extends Error {
  constructor(actualType: string) {
    super(
      `Unsupported image type "${actualType}". We accept JPEG, PNG, or WebP.`,
    );
    this.name = "ListingPhotoUnsupportedTypeError";
  }
}

function isAcceptedType(t: string): t is (typeof LISTING_PHOTO_ACCEPTED_TYPES)[number] {
  return (LISTING_PHOTO_ACCEPTED_TYPES as readonly string[]).includes(t);
}

function safeFileName(name: string): string {
  // Strip path + reserved characters; keep extension. Storage already
  // validates content-type, so a wrong extension won't poison the URL.
  const base = name.split(/[/\\]/).pop() ?? name;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function uploadListingPhoto({
  userId,
  draftId,
  file,
}: UploadListingPhotoArgs): Promise<UploadedListingPhoto> {
  if (file.size > LISTING_PHOTO_MAX_BYTES) {
    throw new ListingPhotoTooLargeError(file.size);
  }
  if (!isAcceptedType(file.type)) {
    throw new ListingPhotoUnsupportedTypeError(file.type);
  }

  const stamp = Date.now();
  const path = `${userId}/${draftId}/${stamp}_${safeFileName(file.name)}`;

  const upload = await supabase.storage
    .from(LISTING_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000",
    });

  if (upload.error) throw upload.error;

  const { data } = supabase.storage
    .from(LISTING_PHOTO_BUCKET)
    .getPublicUrl(path);

  return { publicUrl: data.publicUrl, path, sizeBytes: file.size };
}

/**
 * Best-effort delete a listing photo by storage path. Used when a user
 * removes a photo from the wizard before submitting. Failures are logged
 * but never thrown — a leftover object is preferable to a UI error.
 */
export async function removeListingPhoto(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(LISTING_PHOTO_BUCKET)
      .remove([path]);
    if (error) console.warn("[listing-photo] remove failed", error.message);
  } catch (err) {
    console.warn("[listing-photo] remove threw", err);
  }
}
