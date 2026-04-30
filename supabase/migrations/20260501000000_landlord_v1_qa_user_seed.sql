-- Landlord V1 D5 — permanent QA landlord test user.
--
-- Creates a sign-in-able email/password user (qa-landlord@mdeai.co) with
-- email_confirmed_at + the matching auth.identities row + a
-- landlord_profiles row, so the V1 wizard can be browser-tested against
-- live Supabase WITHOUT burning the project's per-hour email-signup
-- rate limit (which blocked our D4 walkthrough — see CHANGELOG entry
-- 2026-04-30 D4 audit).
--
-- This user is FOR LOCAL/PREVIEW QA ONLY. Production should never seed
-- this user — the migration is intentionally idempotent so re-runs are
-- safe in dev but a single accidental prod apply also won't loop.
--
-- Password: Qa-Landlord-V1-2026   (rotate when no longer needed)
--
-- To remove the QA user later:
--   DELETE FROM auth.users WHERE email='qa-landlord@mdeai.co';
--   (CASCADE removes identities + landlord_profiles via the existing FKs)

DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email='qa-landlord@mdeai.co';
  IF v_existing IS NOT NULL THEN
    RAISE NOTICE 'qa-landlord user already exists (%); migration is a no-op', v_existing;
    RETURN;
  END IF;

  v_user_id := gen_random_uuid();

  -- IMPORTANT: GoTrue's sign-in path crashes with "Database error querying
  -- schema" if confirmation_token / recovery_token / email_change /
  -- email_change_token_new are NULL — it expects empty strings. The
  -- signUp REST endpoint sets them to '' itself; when we hand-craft a
  -- row we have to do the same.
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_anonymous, is_sso_user, email_change_confirm_status,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated', 'authenticated',
    'qa-landlord@mdeai.co',
    crypt('Qa-Landlord-V1-2026', gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers',ARRAY['email']),
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'qa-landlord@mdeai.co',
      'account_type', 'landlord',
      'email_verified', true,
      'phone_verified', false
    ),
    false, false, 0,
    '', '', '', '',
    now(), now()
  );

  -- NOTE: auth.identities.email is a GENERATED column from
  -- identity_data->>'email' — do not include it in the INSERT.
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'qa-landlord@mdeai.co',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(), now(), now()
  );

  INSERT INTO public.landlord_profiles (
    user_id, kind, display_name, whatsapp_e164, primary_neighborhood,
    notes, source
  ) VALUES (
    v_user_id,
    'individual',
    'QA Test Landlord',
    '+573000000001',
    'El Poblado',
    'D5 QA seed — permanent test user. Safe to delete with the auth.users row.',
    'qa_seed'
  );

  RAISE NOTICE 'Seeded qa-landlord@mdeai.co with user_id=%', v_user_id;
END $$;
