-- Applied via MCP on 2026-05-08; captured retrospectively as 25AB.
-- Fix: add named partial unique index on openclaw_conversations.openclaw_message_id
-- so ON CONFLICT ... WHERE clause resolves correctly.
-- Rewrite fn_insert_conversation to branch on NULL messageId (outbound replies
-- have no openclaw_message_id and must always insert).

CREATE UNIQUE INDEX IF NOT EXISTS uidx_openclaw_conversations_message_id
  ON marketing.openclaw_conversations (openclaw_message_id)
  WHERE openclaw_message_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_insert_conversation(p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_id     uuid;
  v_msg_id text;
BEGIN
  v_msg_id := NULLIF(p_data->>'openclaw_message_id', '');

  IF v_msg_id IS NOT NULL THEN
    -- inbound: deduplicate on openclaw_message_id
    INSERT INTO marketing.openclaw_conversations (
      contact_phone, direction, channel, body,
      openclaw_message_id, campaign_id, metadata
    ) VALUES (
      p_data->>'contact_phone',
      p_data->>'direction',
      COALESCE(p_data->>'channel', 'whatsapp'),
      p_data->>'body',
      v_msg_id,
      NULLIF(p_data->>'campaign_id', '')::uuid,
      COALESCE((p_data->>'metadata')::jsonb, '{}')
    )
    ON CONFLICT (openclaw_message_id) WHERE openclaw_message_id IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_id;
  ELSE
    -- outbound reply: no message_id, always insert
    INSERT INTO marketing.openclaw_conversations (
      contact_phone, direction, channel, body,
      campaign_id, metadata
    ) VALUES (
      p_data->>'contact_phone',
      p_data->>'direction',
      COALESCE(p_data->>'channel', 'whatsapp'),
      p_data->>'body',
      NULLIF(p_data->>'campaign_id', '')::uuid,
      COALESCE((p_data->>'metadata')::jsonb, '{}')
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END; $$;
