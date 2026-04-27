import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  getPendingPrompt,
  savePendingPrompt,
} from '@/lib/pending-prompt';

/**
 * Hero AI prompt card on the marketing homepage.
 *
 * Behavior
 * --------
 *   - Logged-in user: clicking "Start →" routes them to `/chat?send=pending`,
 *     which <ChatCanvas> auto-fires.
 *   - Anon user: same `savePendingPrompt`, then routes through
 *     `/signup?returnTo=/chat?send=pending` (Login carries the same param).
 *     After auth, the auth pages redirect to the carried `returnTo` and
 *     <ChatCanvas> picks up the prompt.
 *
 * Suggested prompts below the textarea are click-to-fill, NOT auto-submit —
 * gives the user a chance to edit before committing.
 *
 * Re-hydrates from sessionStorage on mount so a refresh mid-flow doesn't
 * lose the user's draft.
 */

const SUGGESTIONS = [
  'Find top rentals in Laureles under $1,000',
  'Plan a weekend in Medellín',
  'Find restaurants near El Poblado',
];

const TARGET_PATH = '/chat?send=pending';

interface HeroChatPromptProps {
  /**
   * `card` (default) — standalone full-width card with extra chrome. Use when
   *   rendering as a self-contained section (e.g. above the marketing hero).
   * `inline` — slim variant designed to live INSIDE the hero's left column
   *   alongside the headline + image masonry. No outer card wrapper, no
   *   container padding — inherits the hero's grid spacing.
   */
  variant?: 'card' | 'inline';
}

export function HeroChatPrompt({ variant = 'card' }: HeroChatPromptProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Re-hydrate from sessionStorage so a refresh mid-flow doesn't blank
  // the user's draft. (Cleared automatically once /chat?send=pending
  // auto-fires.)
  const [prompt, setPrompt] = useState(() => getPendingPrompt() ?? '');
  const [submitting, setSubmitting] = useState(false);

  // If the user signs in via another tab and comes back here, sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key === 'mdeai_pending_prompt') {
        setPrompt(getPendingPrompt() ?? '');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const submit = useCallback(() => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || submitting) return;
    setSubmitting(true);
    savePendingPrompt(trimmed);

    if (user) {
      // Already authed — straight to chat. The auto-fire effect picks it up.
      navigate(TARGET_PATH);
      return;
    }

    // Anon — route through signup with returnTo carrying the same param.
    const returnTo = encodeURIComponent(TARGET_PATH);
    navigate(`/signup?returnTo=${returnTo}`);
  }, [prompt, submitting, user, navigate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  /* ─── Inline variant ───────────────────────────────────────────────
     Used INSIDE another container's grid (e.g. HeroSection's left column).
     No outer card, no own padding — relies on the parent for spacing. */
  if (variant === 'inline') {
    return (
      <div
        aria-labelledby="hero-prompt-heading"
        className="space-y-4 animate-fade-in"
        style={{ animationDelay: '300ms' }}
      >
        <h2 id="hero-prompt-heading" className="sr-only">
          AI concierge prompt
        </h2>
        {/* Status pill */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400">
            AI Concierge Ready
          </span>
        </div>
        <Textarea
          id="hero-prompt-inline"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Find top rentals in Laureles under $1,000…"
          rows={3}
          className="resize-none text-base leading-relaxed bg-background border-border focus-visible:ring-emerald-500/30"
          disabled={submitting}
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>{' '}
            to start
          </p>
          <Button
            onClick={submit}
            disabled={prompt.trim().length === 0 || submitting}
            size="lg"
            className="rounded-full"
          >
            Start
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI suggests. You decide. — No credit card required.
        </p>
      </div>
    );
  }

  /* ─── Card variant ─────────────────────────────────────────────────
     Standalone clean card matching the reference screenshot:
       ● SYSTEM-style status pill
       Two-line bold headline INSIDE the card
       Sub-headline (lighter)
       Big textarea with ghost-style placeholder, NO visible border —
         the card itself frames it
       Horizontal divider above the footer
       Footer:  "Press Enter to start"  (left, with green Enter)
                "Generate →" / "Start →" button (right, disabled when empty)
       Helper text BELOW the card: "AI suggests. You decide. —
         No credit card required."
  */
  return (
    <section
      aria-labelledby="hero-prompt-heading"
      className="container mx-auto px-4 lg:px-8 pt-8 md:pt-12"
    >
      <div className="mx-auto max-w-3xl bg-card rounded-3xl shadow-elevated p-8 md:p-12 border border-border">
        {/* Status pill */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400">
            AI Concierge Ready
          </span>
        </div>

        {/* Two-line bold headline, like the screenshot */}
        <h2
          id="hero-prompt-heading"
          className="font-display text-2xl md:text-[28px] font-bold leading-snug text-foreground"
        >
          Tell me what you're looking for in Medellín.
        </h2>
        <p className="font-display text-2xl md:text-[28px] font-bold leading-snug text-foreground">
          I'll find rentals, restaurants, events, or plan your trip.
        </p>

        {/* Big borderless textarea — the card frames it */}
        <Textarea
          id="hero-prompt-card"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="I'm moving to Medellín for 3 months and want a 1-bedroom apartment in Laureles with fast Wi-Fi under $1,200/mo, near good cafés and the metro…"
          rows={5}
          disabled={submitting}
          className="mt-6 mb-2 resize-none text-base leading-relaxed bg-transparent border-0 px-0 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none shadow-none"
        />

        {/* Suggested chips — click to fill the textarea */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Divider — separates input from footer like the screenshot */}
        <div className="border-t border-border" />

        {/* Footer: helper text (left) + primary Start button (right) */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-5">
          <p className="text-sm text-muted-foreground">
            Press{' '}
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Enter
            </span>{' '}
            to start
          </p>
          <Button
            onClick={submit}
            disabled={prompt.trim().length === 0 || submitting}
            size="lg"
            className="rounded-full px-6"
          >
            Start
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Helper line outside the card, like the screenshot */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">AI suggests.</span>{' '}
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">You decide.</span>
        {' — '}
        No credit card required.
      </p>
    </section>
  );
}
