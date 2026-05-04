/**
 * useContestApply — wizard state + mutations for the contestant intake form.
 *
 * Responsibilities:
 *  - Maintain in-memory draft (ContestApplyDraft)
 *  - Persist entity_id to sessionStorage so the form is resumable on reload
 *  - saveBio: upsert vote.entities row (INSERT on first call, UPDATE on retry)
 *  - uploadPhoto: upload to listing_photos bucket, invoke moderation edge fn
 *  - uploadIdDoc: upload to identity-docs bucket (first path segment = uid)
 *  - uploadWaiver: upload signed waiver to identity-docs bucket
 *  - submit: set submitted_at timestamp, redirect to thanks page
 */
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  ContestApplyDraft,
  ModerationResult,
  StepBioData,
} from "@/types/contestApply";
import type { Contest } from "@/hooks/useContest";

// ─── Utility: simple slug + short-id generation ──────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 7);
}

// ─── Storage key ─────────────────────────────────────────────────────────────

function sessionKey(contestSlug: string): string {
  return `contest_apply_entity_id__${contestSlug}`;
}

// ─── Default draft factory ────────────────────────────────────────────────────

function emptyDraft(): ContestApplyDraft {
  return {
    entity_id:         null,
    display_name:      "",
    bio:               "",
    socials:           {},
    hero_url:          null,
    photo2_url:        null,
    photo3_url:        null,
    hero_moderation:   null,
    photo2_moderation: null,
    photo3_moderation: null,
    id_front_url:      null,
    id_back_url:       null,
    waiver_url:        null,
    habeas_data:       false,
    image_rights:      false,
    completed_steps:   new Set(),
  };
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseContestApplyReturn {
  draft:        ContestApplyDraft | null;
  step:         number;
  setStep:      (n: number) => void;
  isLoading:    boolean;
  saveBio:      (data: StepBioData) => Promise<void>;
  uploadPhoto:  (
    file: File,
    slot: "hero" | "photo2" | "photo3",
    contest: Contest,
  ) => Promise<{ url: string; moderation: ModerationResult }>;
  uploadIdDoc:  (file: File, docType: "id_front" | "id_back", contestSlug: string) => Promise<string>;
  uploadWaiver: (file: File, contestSlug: string) => Promise<string>;
  submit:       (contest: Contest) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContestApply(contestSlug: string | undefined): UseContestApplyReturn {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [draft,     setDraft]     = useState<ContestApplyDraft | null>(null);
  const [step,      setStep]      = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialise draft + restore entity_id from sessionStorage on mount / slug change
  useEffect(() => {
    if (!contestSlug) return;
    const storedId = sessionStorage.getItem(sessionKey(contestSlug));
    setDraft((prev) => {
      if (prev) return prev; // already initialised
      const d = emptyDraft();
      d.entity_id = storedId ?? null;
      return d;
    });
  }, [contestSlug]);

  // ── saveBio ────────────────────────────────────────────────────────────────

  const saveBio = useCallback(
    async (data: StepBioData): Promise<void> => {
      if (!user || !contestSlug || !draft) throw new Error("Not ready");

      setIsLoading(true);
      try {
        const socialsClean = {
          instagram: data.socials.instagram || null,
          tiktok:    data.socials.tiktok    || null,
          facebook:  data.socials.facebook  || null,
        };

        if (draft.entity_id) {
          // UPDATE existing draft row
          const { error } = await supabase
            .schema("vote" as never)
            .from("entities")
            .update({
              display_name: data.display_name,
              bio:          data.bio,
              socials:      socialsClean,
            })
            .eq("id", draft.entity_id)
            .eq("created_by_user_id", user.id);

          if (error) throw error;
        } else {
          // We need the contest_id — fetch it
          const { data: contestRow, error: contestErr } = await supabase
            .schema("vote" as never)
            .from("contests")
            .select("id")
            .eq("slug", contestSlug)
            .single();
          if (contestErr || !contestRow) throw contestErr ?? new Error("Concurso no encontrado");

          const slug = `${slugify(data.display_name)}-${shortId()}`;

          const { data: inserted, error: insertErr } = await supabase
            .schema("vote" as never)
            .from("entities")
            .insert({
              contest_id:         (contestRow as { id: string }).id,
              slug,
              display_name:       data.display_name,
              bio:                data.bio,
              socials:            socialsClean,
              approved:           false,
              created_by_user_id: user.id,
            })
            .select("id")
            .single();

          if (insertErr || !inserted) throw insertErr ?? new Error("Error al crear la solicitud");

          const entityId = (inserted as { id: string }).id;
          sessionStorage.setItem(sessionKey(contestSlug), entityId);

          setDraft((prev) =>
            prev ? { ...prev, entity_id: entityId } : prev,
          );
        }

        setDraft((prev) =>
          prev
            ? {
                ...prev,
                display_name: data.display_name,
                bio:          data.bio,
                socials:      data.socials,
                completed_steps: new Set([...prev.completed_steps, 1]),
              }
            : prev,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, contestSlug, draft],
  );

  // ── uploadPhoto ────────────────────────────────────────────────────────────

  const uploadPhoto = useCallback(
    async (
      file:    File,
      slot:    "hero" | "photo2" | "photo3",
      contest: Contest,
    ): Promise<{ url: string; moderation: ModerationResult }> => {
      if (!draft?.entity_id) throw new Error("Guarda el paso 1 primero");

      setIsLoading(true);
      try {
        const filename = slot === "hero" ? "hero.jpg" : `${slot}.jpg`;
        const storagePath = `contests/${contest.slug}/${draft.entity_id}/${filename}`;

        const { error: uploadErr } = await supabase.storage
          .from("listing_photos")
          .upload(storagePath, file, { upsert: true, contentType: file.type });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("listing_photos")
          .getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // Moderation
        const { data: modData, error: modErr } = await supabase.functions.invoke(
          "event-photo-moderate",
          {
            body: {
              asset_id:    `${draft.entity_id}_${slot}`,
              asset_type:  slot === "hero" ? "hero_photo" : "gallery_photo",
              storage_url: publicUrl,
              context: {
                event_name:   contest.title,
                event_type:   "pageant",
                organizer_id: contest.org_id,
              },
            },
          },
        );
        if (modErr) throw modErr;

        const moderation = (modData as { success: boolean; data: ModerationResult }).data;

        // Persist URL to entity row
        const updateField =
          slot === "hero" ? { hero_url: storagePath } : {};
        if (Object.keys(updateField).length > 0) {
          await supabase
            .schema("vote" as never)
            .from("entities")
            .update(updateField)
            .eq("id", draft.entity_id);
        }

        const urlKey = `${slot}_url` as "hero_url" | "photo2_url" | "photo3_url";
        const modKey = `${slot}_moderation` as
          | "hero_moderation"
          | "photo2_moderation"
          | "photo3_moderation";

        setDraft((prev) =>
          prev
            ? {
                ...prev,
                [urlKey]: storagePath,
                [modKey]: moderation,
                completed_steps:
                  slot === "hero"
                    ? new Set([...prev.completed_steps, 2])
                    : prev.completed_steps,
              }
            : prev,
        );

        return { url: storagePath, moderation };
      } finally {
        setIsLoading(false);
      }
    },
    [draft],
  );

  // ── uploadIdDoc ────────────────────────────────────────────────────────────
  // identity-docs bucket: first path segment MUST be user UUID (RLS enforces this)

  const uploadIdDoc = useCallback(
    async (
      file:        File,
      docType:     "id_front" | "id_back",
      contestSlug: string,
    ): Promise<string> => {
      if (!user) throw new Error("No autenticado");

      setIsLoading(true);
      try {
        const filename   = docType === "id_front" ? "id_front.jpg" : "id_back.jpg";
        const storagePath = `${user.id}/${contestSlug}/${filename}`;

        const { error } = await supabase.storage
          .from("identity-docs")
          .upload(storagePath, file, { upsert: true, contentType: file.type });
        if (error) throw error;

        // Persist path to entity row
        if (draft?.entity_id) {
          const col = docType === "id_front" ? "id_front_url" : "id_back_url";
          await supabase
            .schema("vote" as never)
            .from("entities")
            .update({ [col]: storagePath })
            .eq("id", draft.entity_id);
        }

        const urlKey = `${docType}_url` as "id_front_url" | "id_back_url";
        setDraft((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, [urlKey]: storagePath };
          if (updated.id_front_url && updated.id_back_url) {
            updated.completed_steps = new Set([...prev.completed_steps, 3]);
          }
          return updated;
        });

        return storagePath;
      } finally {
        setIsLoading(false);
      }
    },
    [user, draft],
  );

  // ── uploadWaiver ───────────────────────────────────────────────────────────

  const uploadWaiver = useCallback(
    async (file: File, contestSlug: string): Promise<string> => {
      if (!user) throw new Error("No autenticado");

      setIsLoading(true);
      try {
        const storagePath = `${user.id}/${contestSlug}/waiver.pdf`;

        const { error } = await supabase.storage
          .from("identity-docs")
          .upload(storagePath, file, { upsert: true, contentType: file.type });
        if (error) throw error;

        if (draft?.entity_id) {
          await supabase
            .schema("vote" as never)
            .from("entities")
            .update({ waiver_url: storagePath })
            .eq("id", draft.entity_id);
        }

        setDraft((prev) =>
          prev
            ? {
                ...prev,
                waiver_url:      storagePath,
                completed_steps: new Set([...prev.completed_steps, 4]),
              }
            : prev,
        );

        return storagePath;
      } finally {
        setIsLoading(false);
      }
    },
    [user, draft],
  );

  // ── submit ─────────────────────────────────────────────────────────────────

  const submit = useCallback(
    async (contest: Contest): Promise<void> => {
      if (!draft?.entity_id) throw new Error("Completa todos los pasos primero");

      setIsLoading(true);
      try {
        const { error } = await supabase
          .schema("vote" as never)
          .from("entities")
          .update({ submitted_at: new Date().toISOString() })
          .eq("id", draft.entity_id);
        if (error) throw error;

        // Clear session storage — submission is final
        if (contestSlug) {
          sessionStorage.removeItem(sessionKey(contestSlug));
        }

        setDraft((prev) =>
          prev
            ? { ...prev, completed_steps: new Set([...prev.completed_steps, 5]) }
            : prev,
        );

        toast.success("¡Solicitud enviada! Revisaremos tu información pronto.");
        navigate(`/host/contest/${contest.slug}/apply/thanks`);
      } finally {
        setIsLoading(false);
      }
    },
    [draft, contestSlug, navigate],
  );

  return {
    draft,
    step,
    setStep,
    isLoading,
    saveBio,
    uploadPhoto,
    uploadIdDoc,
    uploadWaiver,
    submit,
  };
}
