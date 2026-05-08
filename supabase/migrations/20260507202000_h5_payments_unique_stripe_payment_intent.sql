-- 25H5 — payments: UNIQUE constraint on stripe_payment_intent_id
-- Source: tasks/prompts/data/25H5-payments-unique-provider-id.md
-- Live state (verified 2026-05-07): payments table is Stripe-only (columns: stripe_payment_intent_id,
-- stripe_event_id, stripe_customer_id; no `provider`/`provider_payment_id` columns as the original
-- prompt assumed). Duplicate scan returned 0 rows.
--
-- Effect: prevents duplicate Stripe webhook deliveries from creating two payment rows.
-- NULL stripe_payment_intent_id values remain unconstrained (UNIQUE allows multiple NULLs in PG).

ALTER TABLE public.payments
  ADD CONSTRAINT payments_stripe_payment_intent_unique
  UNIQUE (stripe_payment_intent_id);
