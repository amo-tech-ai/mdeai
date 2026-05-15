/**
 * MASTRA-066 — GroundingAttribution
 *
 * ToS-mandatory Google Maps attribution badge.
 *
 * Requirements (https://developers.google.com/maps/ai/grounding-lite/attribution):
 *   - Text "Google Maps" — unmodified, no abbreviation, no localization
 *   - translate="no" — required HTML attribute; prevents browser translation
 *   - Font: Roboto 400 (sans-serif fallback acceptable per official CSS spec)
 *   - Size: 1rem (16px) per official GMP CSS — MCP-verified 2026-05-14
 *   - Color: #5e5e5e on light → contrast ≈ 6.3:1 (WCAG AA ✓)
 *   - Dark-mode: #a8a8a8 on dark-bg → contrast ≈ 5.0:1 (WCAG AA ✓)
 *   - Must immediately follow every card/block showing grounded content,
 *     Maps Grounding Lite results, or ai_summary text from the enrichment pipeline.
 *
 * NEVER render grounded or Places-backed AI copy without this component.
 */

import { cn } from '@/lib/utils';

export interface GroundingAttributionProps {
  /** Extra Tailwind classes for layout positioning. */
  className?: string;
  /**
   * Surface variant. Defaults to 'light'.
   * Use 'dark' when the parent card has a dark background in both themes.
   * Use 'auto' to rely purely on dark: Tailwind prefix (default approach).
   */
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Renders the Google Maps attribution text required by the Maps Grounding Lite
 * Terms of Service. Must appear on every UI surface that shows grounded place
 * data, Maps Grounding Lite results, or cached `ai_summary` content.
 *
 * @example
 * // Restaurant card with AI summary
 * <>
 *   <p className="text-sm text-muted-foreground">{restaurant.aiSummary}</p>
 *   <GroundingAttribution className="mt-1" />
 * </>
 */
export function GroundingAttribution({
  className,
  variant = 'auto',
}: GroundingAttributionProps) {
  const colorClass =
    variant === 'dark'
      ? 'text-[#a8a8a8]'
      : variant === 'light'
        ? 'text-[#5e5e5e]'
        : 'text-[#5e5e5e] dark:text-[#a8a8a8]';

  return (
    /**
     * translate="no" is a ToS requirement.
     * Per spec: "Prevent browsers from translating Google Maps by using the
     * HTML attribute translate='no'."
     */
    <p
      translate="no"
      className={cn(
        // Layout
        'inline-flex items-center gap-1',
        // Typography — Roboto 400, 1rem (16px), no wrap (ToS / official CSS spec)
        // Official: font-family:Roboto,Sans-Serif; font-weight:400; font-size:1rem;
        // letter-spacing:normal; white-space:nowrap; font-style:normal
        'font-sans font-normal not-italic whitespace-nowrap tracking-normal leading-none',
        'text-[1rem]',
        // Color — contrast ≥ 4.5:1 in both modes
        colorClass,
        // Prevent user selection of attribution text
        'select-none',
        className,
      )}
      aria-label="Powered by Google Maps"
    >
      {/* Google Maps map-pin icon (optional per ToS — favicon may be inserted) */}
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="flex-shrink-0 mt-px"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      {/*
       * "Google Maps" — must not be modified, abbreviated, wrapped, or localized.
       * translate="no" on the parent prevents browser auto-translation.
       */}
      Google Maps
    </p>
  );
}
