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

  // Shared prompt-input controls (identical for both variants).
  // Extracted so the JSX layout below can wrap them differently without
  // duplicating the textarea / suggestion-chips / Start button code.
  const promptControls = (
    <>
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

      {/* Textarea */}
      <div>
        <label htmlFor="hero-prompt" className="sr-only">
          Describe what you're looking for
        </label>
        <Textarea
          id="hero-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Find top rentals in Laureles under $1,000…"
          rows={3}
          className="resize-none text-base leading-relaxed bg-background border-border focus-visible:ring-emerald-500/30"
          disabled={submitting}
        />
      </div>

      {/* Suggested chips */}
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

      {/* Footer row: helper + Start */}
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
    </>
  );

  // Inline variant — for use INSIDE the hero's left column. No outer card,
  // no container padding; relies on the parent grid for spacing.
  if (variant === 'inline') {
    return (
      <div
        aria-labelledby="hero-prompt-heading"
        className="space-y-4 animate-fade-in"
        style={{ animationDelay: '300ms' }}
      >
        {/* Heading is provided by the parent <HeroSection> as <h1>;
            we render the prompt label here as a small subhead. */}
        <h2 id="hero-prompt-heading" className="sr-only">
          AI concierge prompt
        </h2>
        {promptControls}
        <p className="text-xs text-muted-foreground">
          AI suggests. You decide. — No credit card required.
        </p>
      </div>
    );
  }

  // Default `card` variant — standalone full-width card. Kept for use as a
  // section above other content (e.g. landing pages that aren't the hero).
  return (
    <section
      aria-labelledby="hero-prompt-heading"
      className="container mx-auto px-4 lg:px-8 pt-8 md:pt-12"
    >
      <div className="mx-auto max-w-3xl bg-card rounded-3xl shadow-elevated p-6 md:p-10 border border-border space-y-5">
        {/* Headline */}
        <h2
          id="hero-prompt-heading"
          className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground"
        >
          What are you looking for in Medellín?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Ask for rentals, restaurants, events, or trip plans.
        </p>
        {promptControls}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        AI suggests. You decide. — No credit card required.
      </p>
    </section>
  );
}
