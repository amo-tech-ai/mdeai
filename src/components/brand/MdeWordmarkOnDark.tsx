import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Material-style heart; tight crop in HEART_VIEWBOX (flat fill #E31B23). */
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const HEART_VIEWBOX = { x: 2, y: 3, w: 20, h: 18.45 };
const HEART_FILL = "#E31B23";
const TEXT_FILL = "#FFFFFF";

/** User-space font size (matches viewBox scale). */
const FONT_PX = 40;
/**
 * Approximate cap-height / em for Montserrat Bold (~OS/2 sCapHeight ≈ 0.72–0.73 UPM).
 * Used to size the heart 10% above cap for optical balance.
 */
const CAP_HEIGHT_RATIO = 0.725;
const capHeightPx = FONT_PX * CAP_HEIGHT_RATIO;
/** Heart bbox height: 10% larger than cap height (spec). */
const HEART_HEIGHT = capHeightPx * 1.1;
const HEART_WIDTH = (HEART_VIEWBOX.w / HEART_VIEWBOX.h) * HEART_HEIGHT;

/** Horizontal safe padding inside the mark. */
const SAFE_PAD_X = 36;
/**
 * Single baseline for I, heart tip, and Medellín (alphabetic).
 * Chosen so cap height + í acute fit above and a little slack below.
 */
const BASELINE_Y = 56;
/**
 * Approximate advance width of “I” at FONT_PX Montserrat Bold (narrow glyph).
 * Tuned for spacing; SVG cannot measure text without getBBox in browser only.
 */
const I_ADVANCE = Math.round(FONT_PX * 0.32);
const GAP_AFTER_I = 11;
const GAP_AFTER_HEART = 12;

const I_X = SAFE_PAD_X;
const HEART_X = I_X + I_ADVANCE + GAP_AFTER_I;
const HEART_TOP = BASELINE_Y - HEART_HEIGHT;
const MEDELLIN_X = HEART_X + HEART_WIDTH + GAP_AFTER_HEART;

/** Wide canvas + safe area (í accent + descender slack). */
const VIEW_W = 460;
const VIEW_H = 72;
const MEDELLIN_TEXT = "Medell\u00EDn";

type MdeWordmarkOnDarkProps = {
  className?: string;
};

/**
 * Dark-theme wordmark: baseline-aligned I + heart + Medellín, Montserrat Bold,
 * heart scaled to 1.1× cap height, tip pinned to baseline (xMidYMax + tight viewBox).
 */
export function MdeWordmarkOnDark({ className }: MdeWordmarkOnDarkProps) {
  const textStyle: CSSProperties = {
    fontFamily: "'Montserrat', 'DM Sans', ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: FONT_PX,
    letterSpacing: "0.01em",
    fontFeatureSettings: '"kern" 1, "liga" 1',
  };

  const vb = HEART_VIEWBOX;

  return (
    <svg
      className={cn("inline-block max-w-full", className)}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="mdeai.co — I Love Medellín"
      textRendering="geometricPrecision"
    >
      <text
        x={I_X}
        y={BASELINE_Y}
        fill={TEXT_FILL}
        dominantBaseline="alphabetic"
        style={textStyle}
      >
        I
      </text>

      <svg
        x={HEART_X}
        y={HEART_TOP}
        width={HEART_WIDTH}
        height={HEART_HEIGHT}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        <path fill={HEART_FILL} d={HEART_PATH} />
      </svg>

      <text
        x={MEDELLIN_X}
        y={BASELINE_Y}
        fill={TEXT_FILL}
        dominantBaseline="alphabetic"
        style={textStyle}
      >
        {MEDELLIN_TEXT}
      </text>
    </svg>
  );
}
