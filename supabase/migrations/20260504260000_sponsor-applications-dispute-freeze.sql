-- Task 058: dispute freeze flag for active disputes + refund_pending for Stripe-not-configured path

-- Add dispute_freeze to sponsor.applications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sponsor' AND table_name = 'applications'
      AND column_name = 'dispute_freeze'
  ) THEN
    ALTER TABLE sponsor.applications
      ADD COLUMN dispute_freeze boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add refund_pending to sponsor.invoices (needed when STRIPE_SECRET_KEY is not configured)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sponsor' AND table_name = 'invoices'
      AND column_name = 'refund_pending'
  ) THEN
    ALTER TABLE sponsor.invoices
      ADD COLUMN refund_pending boolean NOT NULL DEFAULT false;
  END IF;
END $$;
