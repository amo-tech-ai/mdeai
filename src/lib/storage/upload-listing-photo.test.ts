import { describe, it, expect, vi } from "vitest";

// Mock the supabase client BEFORE importing the module under test, so the
// real client (which constructs an auth session from localStorage at import
// time) doesn't trigger an unhandled rejection in JSDOM.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: vi.fn(),
      }),
    },
  },
}));

import {
  LISTING_PHOTO_ACCEPTED_TYPES,
  LISTING_PHOTO_MAX_BYTES,
  ListingPhotoTooLargeError,
  ListingPhotoUnsupportedTypeError,
  uploadListingPhoto,
} from "./upload-listing-photo";

// We test the pre-flight validation (size + MIME) since those happen
// purely client-side and short-circuit the network call. The actual
// supabase.storage upload is verified separately in the browser proof
// against live Supabase.

function makeFile(name: string, type: string, sizeBytes: number) {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("uploadListingPhoto pre-flight validation", () => {
  it("exposes a 5 MB ceiling matching the bucket file_size_limit", () => {
    expect(LISTING_PHOTO_MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it("only accepts JPEG / PNG / WebP", () => {
    expect([...LISTING_PHOTO_ACCEPTED_TYPES]).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  it("throws ListingPhotoTooLargeError for files over 5 MB", async () => {
    const tooBig = makeFile("huge.jpg", "image/jpeg", 6 * 1024 * 1024);
    await expect(
      uploadListingPhoto({ userId: "u1", draftId: "d1", file: tooBig }),
    ).rejects.toBeInstanceOf(ListingPhotoTooLargeError);
  });

  it("throws ListingPhotoUnsupportedTypeError for non-image types", async () => {
    const wrong = makeFile("notes.pdf", "application/pdf", 1024);
    await expect(
      uploadListingPhoto({ userId: "u1", draftId: "d1", file: wrong }),
    ).rejects.toBeInstanceOf(ListingPhotoUnsupportedTypeError);
  });

  it("includes file size in the too-large error message", async () => {
    const tooBig = makeFile("huge.jpg", "image/jpeg", 7 * 1024 * 1024);
    try {
      await uploadListingPhoto({ userId: "u1", draftId: "d1", file: tooBig });
    } catch (e) {
      expect((e as Error).message).toMatch(/7\.0 MB/);
    }
  });
});
