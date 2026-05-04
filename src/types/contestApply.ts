/**
 * contestApply.ts — Zod schemas and TypeScript types for the contestant
 * intake wizard (task 018). One schema per wizard step.
 */
import { z } from "zod";

// ─── Step 1: Bio & social ────────────────────────────────────────────────────

export const StepBioSchema = z.object({
  display_name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  bio: z
    .string()
    .min(50, "La presentación debe tener al menos 50 caracteres")
    .max(800, "La presentación no puede superar 800 caracteres"),
  socials: z
    .object({
      instagram: z.string().url("URL de Instagram inválida").optional().or(z.literal("")),
      tiktok:    z.string().url("URL de TikTok inválida").optional().or(z.literal("")),
      facebook:  z.string().url("URL de Facebook inválida").optional().or(z.literal("")),
    })
    .refine(
      (data) => Object.values(data).some((v) => v && v.trim() !== ""),
      { message: "Agrega al menos una red social" },
    ),
});

export type StepBioData = z.infer<typeof StepBioSchema>;

// ─── Step 2: Photos ──────────────────────────────────────────────────────────

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

const photoFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_PHOTO_BYTES, "La foto no puede superar 10 MB")
  .refine(
    (f) => f.type.startsWith("image/"),
    "Solo se aceptan archivos de imagen",
  );

export const StepPhotosSchema = z.object({
  hero:   photoFileSchema,
  photo2: photoFileSchema.optional(),
  photo3: photoFileSchema.optional(),
});

export type StepPhotosData = z.infer<typeof StepPhotosSchema>;

// ─── Step 3: Identity documents ──────────────────────────────────────────────

const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15 MB

const docFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_DOC_BYTES, "El archivo no puede superar 15 MB")
  .refine(
    (f) => f.type.startsWith("image/") || f.type === "application/pdf",
    "Solo se aceptan imágenes o PDF",
  );

export const StepIdDocsSchema = z.object({
  id_front: docFileSchema,
  id_back:  docFileSchema,
});

export type StepIdDocsData = z.infer<typeof StepIdDocsSchema>;

// ─── Step 4: Waiver ──────────────────────────────────────────────────────────

export const StepWaiverSchema = z.object({
  waiver: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_DOC_BYTES, "El archivo no puede superar 15 MB")
    .refine(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/"),
      "Solo se aceptan PDF o imagen del waiver firmado",
    ),
});

export type StepWaiverData = z.infer<typeof StepWaiverSchema>;

// ─── Step 5: Consent ─────────────────────────────────────────────────────────

export const StepConsentSchema = z.object({
  habeas_data:  z.literal(true, { errorMap: () => ({ message: "Debes aceptar el tratamiento de datos" }) }),
  image_rights: z.literal(true, { errorMap: () => ({ message: "Debes autorizar el uso de tu imagen" }) }),
});

export type StepConsentData = z.infer<typeof StepConsentSchema>;

// ─── Moderation result ───────────────────────────────────────────────────────

export interface ModerationResult {
  verdict: "approved" | "rejected" | "flagged";
  flags:   string[];
  reasons: string[];
}

// ─── Composite draft ─────────────────────────────────────────────────────────

export interface ContestApplyDraft {
  entity_id:    string | null;
  // Step 1
  display_name: string;
  bio:          string;
  socials:      StepBioData["socials"];
  // Step 2 — storage paths (not File objects; those are transient)
  hero_url:     string | null;
  photo2_url:   string | null;
  photo3_url:   string | null;
  hero_moderation:   ModerationResult | null;
  photo2_moderation: ModerationResult | null;
  photo3_moderation: ModerationResult | null;
  // Step 3
  id_front_url: string | null;
  id_back_url:  string | null;
  // Step 4
  waiver_url:   string | null;
  // Step 5
  habeas_data:  boolean;
  image_rights: boolean;
  // Progress
  completed_steps: Set<number>;
}
