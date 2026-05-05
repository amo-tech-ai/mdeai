import { useEffect, useRef, useCallback } from "react";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/**
 * Invisible Cloudflare Turnstile widget.
 * Calls onToken when a challenge token is issued.
 * When VITE_TURNSTILE_SITE_KEY is not set, calls onToken("dev-bypass") immediately
 * so the vote flow works in dev without a real Turnstile account.
 */
export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      appearance: "interaction-only",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => {
        onExpireRef.current?.();
        // Reset so a fresh token is generated before the next vote
        if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      },
    });
  }, []);

  useEffect(() => {
    if (!SITE_KEY) {
      // Dev bypass — no real Turnstile account needed
      onTokenRef.current("dev-bypass");
      return;
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load Turnstile script once
    window.onTurnstileLoad = renderWidget;
    if (!document.getElementById("cf-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
    };
  }, [renderWidget]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="hidden" aria-hidden="true" />;
}
