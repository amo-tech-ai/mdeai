import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MAIN_NAV_LINKS } from "@/config/marketingNav";
import { HeroChatPrompt } from "@/components/home/HeroChatPrompt";

/**
 * Hero section — chat-window-first.
 *
 * The hero is now ONLY the AI concierge prompt + the headline that frames
 * it. Right-side image masonry was removed per design feedback ("the hero
 * section needs to be a chat window"). Marketing visual depth lives in
 * the sections below the hero (Discover, AI Features, Popular in Medellín).
 *
 * Layout (centered, single column):
 *   ┌──────────────────────────────────────────┐
 *   │           [I ❤ Medellín]                  │
 *   │                                          │
 *   │      Your Next Adventure Starts          │
 *   │           Here in Colombia               │
 *   │                                          │
 *   │   Your guide to discovering cities,      │
 *   │   experiences, and unforgettable trips   │
 *   │           across Colombia.               │
 *   │                                          │
 *   │   ┌──────────────────────────────────┐   │
 *   │   │  ● AI CONCIERGE READY            │   │
 *   │   │  [textarea: Find top rentals…]   │   │
 *   │   │  [chip] [chip] [chip]            │   │
 *   │   │  Press Enter      [Start →]      │   │
 *   │   │  AI suggests. You decide. — …    │   │
 *   │   └──────────────────────────────────┘   │
 *   └──────────────────────────────────────────┘
 */
export function HeroSection() {
  return (
    <section className="relative py-12 md:py-16 lg:py-20 bg-secondary/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Centered card — replaces the previous 2-column grid. The card
            background, padding, and shadow give the chat window the
            visual weight the page needs without the right-side masonry. */}
        <div className="bg-card rounded-3xl shadow-elevated p-6 md:p-10 lg:p-12 max-w-4xl mx-auto">
          <div className="space-y-6 text-center">
            {/* Brand */}
            <div className="animate-fade-in flex flex-col items-center space-y-4">
              <BrandLogo variant="hero" />
              {/* Mobile / tablet quick nav (hidden ≥lg where SiteHeader has the links) */}
              <nav
                className="flex flex-wrap justify-center gap-x-4 gap-y-2 lg:hidden"
                aria-label="Sections"
              >
                {MAIN_NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Headline */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Your Next Adventure Starts Here in Colombia
            </h1>

            {/* Supporting text */}
            <p
              className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in max-w-2xl mx-auto"
              style={{ animationDelay: "200ms" }}
            >
              Your guide to discovering cities, experiences, and unforgettable
              trips across Colombia.
            </p>

            {/* AI Concierge chat prompt — the hero's primary affordance.
                Logged-in users go straight to /chat?send=pending; anon users
                round-trip through /signup with the prompt saved in
                sessionStorage. See HeroChatPrompt. */}
            <div className="text-left max-w-2xl mx-auto pt-2">
              <HeroChatPrompt variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
