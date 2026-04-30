import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MoveWhen } from "@/lib/whatsapp-deeplink";

/**
 * useContactHost — Landlord V1 D7.5.
 *
 * Submits a renter's "Contact Host" form to the lead-from-form edge fn.
 * The fn runs on anon (verify_jwt:false) so renters don't need to sign
 * in to message hosts. Returns the host's WhatsApp number so the caller
 * can build a wa.me link and open it in a new tab — that "open WhatsApp"
 * action IS our verification (cheaper than SMS OTP, higher signal).
 */

export interface ContactHostInput {
  apartment_id: string;
  name: string;
  move_when: MoveWhen;
  message?: string;
  /** Hidden honeypot field — empty for real users, filled by bots. */
  website?: string;
  /** Anonymous-session id from useAnonSession — used for per-session rate limit. */
  anon_session_id?: string;
}

export interface ContactHostSuccess {
  lead_id: string;
  whatsapp_e164: string;
  landlord_display_name: string;
  apartment: {
    id: string;
    title: string;
    neighborhood: string;
  };
}

interface ContactHostError extends Error {
  code?: string;
}

export function useContactHost() {
  return useMutation<ContactHostSuccess, ContactHostError, ContactHostInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: ContactHostSuccess & { suppressed?: boolean };
        error?: { code: string; message: string; details?: unknown };
      }>("lead-from-form", { body: input });

      if (error) {
        // supabase-js wraps non-2xx in `error`. Try to surface the
        // structured rejection from the body so callers can show a
        // useful message ("rate limited", "no whatsapp on file" etc.).
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            const e = new Error(
              body?.error?.message ?? (error as Error).message,
            ) as ContactHostError;
            e.code = body?.error?.code ?? "EDGE_ERROR";
            throw e;
          } catch (parseErr) {
            if (parseErr instanceof Error && (parseErr as ContactHostError).code) {
              throw parseErr;
            }
          }
        }
        const e = new Error(
          (error as Error).message ?? "Couldn't send your message",
        ) as ContactHostError;
        e.code = "EDGE_ERROR";
        throw e;
      }

      // Honeypot path returns 200 + suppressed:true. Surface it as a
      // generic success so the bot UX doesn't leak the existence of
      // the trap. Real users never hit this branch.
      if (data?.data && "suppressed" in data.data) {
        const e = new Error("Inquiry suppressed") as ContactHostError;
        e.code = "SUPPRESSED";
        throw e;
      }

      if (!data?.success || !data.data) {
        const e = new Error(
          data?.error?.message ?? "Unexpected response shape",
        ) as ContactHostError;
        e.code = data?.error?.code ?? "INVALID_RESPONSE";
        throw e;
      }

      return data.data as ContactHostSuccess;
    },
  });
}
