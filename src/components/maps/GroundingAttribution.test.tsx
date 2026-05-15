/**
 * MASTRA-066 — GroundingAttribution unit tests
 *
 * Verifies ToS compliance (developers.google.com/maps/ai/grounding-lite/attribution)
 * as confirmed by MCP google-maps-code-assist on 2026-05-14.
 *
 * Official CSS spec verified via MCP:
 *   font-family: Roboto, Sans-Serif;
 *   font-style: normal;
 *   font-weight: 400;
 *   font-size: 1rem;          ← key: NOT 12px
 *   letter-spacing: normal;
 *   white-space: nowrap;
 *   color: #5e5e5e;
 *
 * Test contracts:
 * 1. translate="no" attribute present — ToS requirement
 * 2. Text "Google Maps" appears verbatim (correct case)
 * 3. aria-label="Powered by Google Maps" for screen readers
 * 4. font-size 1rem class applied (text-[1rem])
 * 5. whitespace-nowrap class applied — prevents "Google\nMaps"
 * 6. font-normal class applied (weight 400)
 * 7. not-italic class applied
 * 8. tracking-normal (letter-spacing: normal)
 * 9. Light variant: text-[#5e5e5e] class
 * 10. Dark variant: text-[#a8a8a8] class
 * 11. Auto variant (default): both light + dark classes via dark: prefix
 * 12. Custom className prop forwarded
 * 13. Rendered as a <p> element
 * 14. SVG map-pin icon present and aria-hidden
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroundingAttribution } from './GroundingAttribution';

describe('GroundingAttribution — ToS compliance', () => {
  // ── Requirement 1: translate="no" ──────────────────────────────────────────
  it('has translate="no" attribute (ToS requirement)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('translate', 'no');
  });

  // ── Requirement 2: exact "Google Maps" text ────────────────────────────────
  it('renders "Google Maps" text verbatim (no modification)', () => {
    render(<GroundingAttribution />);
    // getByText uses substring match by default with exact:false for text nodes
    expect(screen.getByText(/Google Maps/)).toBeInTheDocument();
  });

  it('"Google Maps" text is in correct title-case (not lowercase/uppercase)', () => {
    const { container } = render(<GroundingAttribution />);
    expect(container.textContent).toContain('Google Maps');
    // Must NOT appear as all-caps or all-lowercase
    expect(container.textContent).not.toContain('GOOGLE MAPS');
    expect(container.textContent).not.toContain('google maps');
  });

  // ── Requirement 3: aria-label ──────────────────────────────────────────────
  it('has aria-label="Powered by Google Maps"', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el).toHaveAttribute('aria-label', 'Powered by Google Maps');
  });

  // ── Requirement 4: font-size 1rem ─────────────────────────────────────────
  it('applies text-[1rem] class (official GMP CSS: font-size: 1rem)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    // text-[1rem] is the Tailwind class mapping to font-size: 1rem
    expect(el?.className).toContain('text-[1rem]');
  });

  it('does NOT use 12px font-size (12px violates GMP official spec)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).not.toContain('text-[12px]');
    expect(el?.className).not.toContain('text-xs');
  });

  // ── Requirement 5: whitespace-nowrap ──────────────────────────────────────
  it('applies whitespace-nowrap (prevents "Google\\nMaps" line break)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('whitespace-nowrap');
  });

  // ── Requirement 6: font-weight 400 ────────────────────────────────────────
  it('applies font-normal (weight 400)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('font-normal');
  });

  // ── Requirement 7: font-style normal ─────────────────────────────────────
  it('applies not-italic (font-style: normal)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('not-italic');
  });

  // ── Requirement 8: letter-spacing normal ──────────────────────────────────
  it('applies tracking-normal (letter-spacing: normal)', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('tracking-normal');
  });

  // ── Requirement 9: light variant color ────────────────────────────────────
  it('applies #5e5e5e color class in light variant', () => {
    const { container } = render(<GroundingAttribution variant="light" />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('text-[#5e5e5e]');
  });

  // ── Requirement 10: dark variant color ────────────────────────────────────
  it('applies #a8a8a8 color class in dark variant', () => {
    const { container } = render(<GroundingAttribution variant="dark" />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('text-[#a8a8a8]');
  });

  // ── Requirement 11: auto variant (default) ────────────────────────────────
  it('auto variant (default) applies #5e5e5e and dark:text-[#a8a8a8]', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('text-[#5e5e5e]');
    // dark-mode class uses Tailwind dark: prefix — present in static className
    expect(el?.className).toContain('dark:text-[#a8a8a8]');
  });

  // ── Requirement 12: custom className ─────────────────────────────────────
  it('forwards custom className prop', () => {
    const { container } = render(<GroundingAttribution className="mt-2 ml-3" />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('mt-2');
    expect(el?.className).toContain('ml-3');
  });

  // ── Requirement 13: rendered as <p> ───────────────────────────────────────
  it('renders as a <p> element', () => {
    const { container } = render(<GroundingAttribution />);
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('div')).toBeNull();
    expect(container.querySelector('span')).toBeNull();
  });

  // ── Requirement 14: SVG map-pin icon ─────────────────────────────────────
  it('renders a map-pin SVG icon that is aria-hidden', () => {
    const { container } = render(<GroundingAttribution />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  // ── Integration: select-none (no text selection of ToS badge) ─────────────
  it('applies select-none to prevent text selection of attribution', () => {
    const { container } = render(<GroundingAttribution />);
    const el = container.querySelector('p');
    expect(el?.className).toContain('select-none');
  });

  // ── Integration: all three variants render without throwing ───────────────
  it.each(['light', 'dark', 'auto'] as const)(
    'renders variant="%s" without throwing',
    (variant) => {
      expect(() => render(<GroundingAttribution variant={variant} />)).not.toThrow();
    },
  );
});
