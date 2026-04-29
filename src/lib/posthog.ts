import posthog from 'posthog-js';

/**
 * PostHog product analytics — conversion funnel + behavior.
 *
 * Event shape is a discriminated union (see `AppEvent` below). Forces every
 * call site to declare the event name + typed payload. Adding a new event
 * = one new union arm; PostHog dashboards group by that name automatically.
 *
 * Init is gated on `VITE_POSTHOG_KEY`. If empty, PostHog is NOT initialized
 * and `trackEvent()` is a silent no-op (so dev builds without the env var
 * stay clean).
 *
 * Why a separate sink from Sentry: PostHog is for product analytics
 * (counts, conversion rates, funnels). Sentry is for error monitoring.
 * Both should fire on every relevant event but the data shapes differ —
 * Sentry wants breadcrumbs, PostHog wants typed properties.
 */

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || key.trim().length === 0) {
    // Dev / preview builds without the env var — stay silent.
    return;
  }
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() ||
    'https://us.i.posthog.com';
  posthog.init(key, {
    api_host: host,
    // Capture page_view + page_leave automatically; we add our own
    // domain events on top via trackEvent().
    capture_pageview: true,
    capture_pageleave: true,
    // Person profiles only for identified users — keeps anon events
    // anonymous, smaller MAU bill, GDPR-friendlier.
    person_profiles: 'identified_only',
    // No autocapture of clicks/forms — too noisy. Domain events only.
    autocapture: false,
    // Disable session recording until we explicitly opt in (it adds
    // ~50KB + privacy considerations).
    disable_session_recording: true,
  });
  initialized = true;
}

/**
 * Discriminated-union of every domain event we capture. Adding an event:
 *   1. Add an arm here.
 *   2. Call `trackEvent({ name: 'foo', ... })` from the call site.
 * PostHog dashboards group by `name` automatically.
 */
export type AppEvent =
  // — Marketing-homepage prompt funnel —
  | { name: 'prompt_send'; source: 'hero' | 'chat_input'; promptLength: number; authed: boolean }
  | { name: 'prompt_autofired'; promptLength: number }
  // — Maps —
  | { name: 'pin_click'; pinId: string; viaKeyboard: boolean; newTab: boolean }
  | { name: 'cluster_expand'; clusterSize: number }
  | { name: 'viewport_idle'; bboxN: number; bboxS: number; bboxE: number; bboxW: number; zoom: number }
  | { name: 'viewport_search'; neighborhood: string }
  | { name: 'map_auth_failed'; error?: string }
  // — Conversion (rentals / booking) —
  | { name: 'rental_save_toggled'; apartmentId: string; saved: boolean }
  | { name: 'add_to_trip_opened'; apartmentId: string }
  | { name: 'booking_submitted'; apartmentId: string; estimatedTotal: number; nights: number }
  | { name: 'inquiry_sent'; apartmentId: string }
  | { name: 'outbound_clicked'; apartmentId: string; sourceUrl: string }
  // — Landlord V1 (D2 + D3 events; rest follow per plan §7.2) —
  | { name: 'landlord_signup_started'; from: 'signup_page' | 'host_redirect' }
  | { name: 'landlord_signup_completed'; method: 'email' | 'google' }
  | { name: 'onboarding_step_completed'; step: 1 | 2 | 3; durationSec: number }
  | { name: 'onboarding_completed'; totalDurationSec: number }
  | { name: 'verification_doc_uploaded'; docKind: 'national_id' | 'passport' | 'rut' | 'property_deed' | 'utility_bill' }
  | { name: 'listing_create_step'; step: 1 | 2 | 3 | 4; durationSec: number }
  | { name: 'listing_photo_uploaded'; sizeBytes: number; totalCount: number };

/**
 * Capture a domain event. Silent no-op when PostHog isn't initialized.
 * Wrapped in try/catch so a sink hiccup never breaks the app.
 */
export function trackEvent(event: AppEvent): void {
  if (!initialized) return;
  try {
    const { name, ...properties } = event;
    posthog.capture(name, properties);
  } catch (err) {
    // Never let analytics break the app. Surface to console for dev
    // visibility — Sentry will pick it up via global error handler.
    console.warn('[posthog] capture threw, swallowing:', err);
  }
}

/**
 * Identify a signed-in user so subsequent events attach to a person profile.
 * Call from useAuth's onAuthStateChange when SIGNED_IN, or from your sign-in
 * page after success.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    posthog.identify(userId, traits);
  } catch (err) {
    console.warn('[posthog] identify threw:', err);
  }
}

/** Reset the PostHog session on sign-out so events don't leak across users. */
export function resetPostHog(): void {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn('[posthog] reset threw:', err);
  }
}
