-- Applied via MCP on 2026-05-08; captured retrospectively as 25AB.
-- RPC wrappers called by openclaw-concierge-webhook (068) and openclaw-delivery-webhook (067).

-- ─── fn_insert_conversation (initial version) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_insert_conversation(p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO marketing.openclaw_conversations (
    contact_phone, direction, channel, body,
    openclaw_message_id, campaign_id, metadata
  ) VALUES (
    p_data->>'contact_phone',
    p_data->>'direction',
    COALESCE(p_data->>'channel', 'whatsapp'),
    p_data->>'body',
    NULLIF(p_data->>'openclaw_message_id', ''),
    NULLIF(p_data->>'campaign_id', '')::uuid,
    COALESCE((p_data->>'metadata')::jsonb, '{}')
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_insert_conversation(jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_insert_conversation(jsonb) FROM anon, authenticated;

-- ─── fn_update_conversation_intent ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_conversation_intent(
  p_message_id text, p_intent text, p_confidence numeric, p_reply text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  UPDATE marketing.openclaw_conversations SET
    intent     = p_intent,
    confidence = p_confidence,
    reply_body = p_reply,
    replied_at = pg_catalog.now()
  WHERE openclaw_message_id = p_message_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_update_conversation_intent(text,text,numeric,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_update_conversation_intent(text,text,numeric,text) FROM anon, authenticated;

-- ─── fn_upsert_delivery_log (initial version) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_upsert_delivery_log(p_data jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  INSERT INTO marketing.delivery_logs (
    openclaw_message_id, channel, recipient, status, metadata,
    outbox_id, campaign_id, error_code, error_message,
    sent_at, delivered_at, read_at
  ) VALUES (
    NULLIF(p_data->>'openclaw_message_id', ''),
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
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_upsert_delivery_log(jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_upsert_delivery_log(jsonb) FROM anon, authenticated;
