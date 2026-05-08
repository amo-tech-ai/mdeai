-- Applied via MCP on 2026-05-08; captured retrospectively as 25AB.
-- Fix: fn_upsert_delivery_log — add ON CONFLICT for openclaw_message_id;
-- branch on NULL message id (outbound without id = plain INSERT).

CREATE OR REPLACE FUNCTION public.fn_upsert_delivery_log(p_data jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_msg_id text := p_data->>'openclaw_message_id';
BEGIN
  IF v_msg_id IS NULL OR v_msg_id = '' THEN
    INSERT INTO marketing.delivery_logs (
      channel, recipient, status, metadata,
      outbox_id, campaign_id, error_code, error_message,
      sent_at, delivered_at, read_at
    ) VALUES (
      p_data->>'channel', p_data->>'recipient', p_data->>'status',
      COALESCE((p_data->>'metadata')::jsonb, '{}'),
      NULLIF(p_data->>'outbox_id',   '')::uuid,
      NULLIF(p_data->>'campaign_id', '')::uuid,
      NULLIF(p_data->>'error_code',    ''),
      NULLIF(p_data->>'error_message', ''),
      NULLIF(p_data->>'sent_at',      '')::timestamptz,
      NULLIF(p_data->>'delivered_at', '')::timestamptz,
      NULLIF(p_data->>'read_at',      '')::timestamptz
    );
  ELSE
    INSERT INTO marketing.delivery_logs (
      openclaw_message_id, channel, recipient, status, metadata,
      outbox_id, campaign_id, error_code, error_message,
      sent_at, delivered_at, read_at
    ) VALUES (
      v_msg_id,
      p_data->>'channel', p_data->>'recipient', p_data->>'status',
      COALESCE((p_data->>'metadata')::jsonb, '{}'),
      NULLIF(p_data->>'outbox_id',   '')::uuid,
      NULLIF(p_data->>'campaign_id', '')::uuid,
      NULLIF(p_data->>'error_code',    ''),
      NULLIF(p_data->>'error_message', ''),
      NULLIF(p_data->>'sent_at',      '')::timestamptz,
      NULLIF(p_data->>'delivered_at', '')::timestamptz,
      NULLIF(p_data->>'read_at',      '')::timestamptz
    )
    ON CONFLICT (openclaw_message_id) WHERE openclaw_message_id IS NOT NULL
    DO UPDATE SET
      status        = EXCLUDED.status,
      error_code    = EXCLUDED.error_code,
      error_message = EXCLUDED.error_message,
      sent_at       = COALESCE(EXCLUDED.sent_at,      marketing.delivery_logs.sent_at),
      delivered_at  = COALESCE(EXCLUDED.delivered_at, marketing.delivery_logs.delivered_at),
      read_at       = COALESCE(EXCLUDED.read_at,      marketing.delivery_logs.read_at),
      updated_at    = pg_catalog.now();
  END IF;
END; $$;
