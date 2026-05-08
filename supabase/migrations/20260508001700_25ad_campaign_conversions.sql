-- 25AD: marketing.campaign_conversions — post-to-sale attribution
-- Last-touch, 7-day window. fn_record_conversion resolves campaign from outbound_clicks.

CREATE TABLE marketing.campaign_conversions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid        NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  campaign_post_id      uuid        REFERENCES marketing.campaign_posts(id) ON DELETE SET NULL,
  send_log_id           uuid        REFERENCES outreach.send_log(id) ON DELETE SET NULL,
  conversion_type       text        NOT NULL CHECK (conversion_type IN (
    'ticket_purchase','apartment_booking','car_rental_booking',
    'restaurant_reservation','rental_inquiry','lead_created','sponsor_click'
  )),
  subject_id            uuid        NOT NULL,
  subject_table         text        NOT NULL,
  value_cents           integer,
  user_id               uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  attribution_model     text        NOT NULL DEFAULT 'last_touch'
                        CHECK (attribution_model IN ('last_touch','first_touch','linear')),
  attributed_at         timestamptz NOT NULL DEFAULT now(),
  attribution_window_days integer   NOT NULL DEFAULT 7,
  metadata              jsonb       NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campaign_conversions_campaign_idx ON marketing.campaign_conversions (campaign_id, attributed_at DESC);
CREATE INDEX campaign_conversions_post_idx     ON marketing.campaign_conversions (campaign_post_id) WHERE campaign_post_id IS NOT NULL;
CREATE INDEX campaign_conversions_type_idx     ON marketing.campaign_conversions (conversion_type, attributed_at DESC);
CREATE INDEX campaign_conversions_user_idx     ON marketing.campaign_conversions (user_id) WHERE user_id IS NOT NULL;
ALTER TABLE marketing.campaign_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_conversions"  ON marketing.campaign_conversions FOR ALL TO anon        USING (false);
CREATE POLICY "svc_full_conversions"      ON marketing.campaign_conversions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_own_conversions" ON marketing.campaign_conversions FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM marketing.marketing_campaigns WHERE owner_id = (SELECT auth.uid())));
COMMENT ON TABLE marketing.campaign_conversions IS 'Attribution: links a social post or outreach send to a downstream sale/booking. Last-touch, 7-day window by default.';

ALTER TABLE marketing.campaign_metrics
  ADD COLUMN IF NOT EXISTS conversions   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_cents bigint  NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.fn_record_conversion(
  p_subject_id uuid, p_subject_table text, p_conversion_type text,
  p_value_cents integer DEFAULT NULL, p_user_id uuid DEFAULT NULL, p_metadata jsonb DEFAULT '{}'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_click       public.outbound_clicks%ROWTYPE;
  v_campaign_id uuid; v_post_id uuid; v_conv_id uuid;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_click FROM public.outbound_clicks WHERE user_id = p_user_id AND created_at > pg_catalog.now() - interval '7 days' ORDER BY created_at DESC LIMIT 1;
    IF v_click.id IS NOT NULL THEN
      v_campaign_id := (v_click.metadata->>'campaign_id')::uuid;
      v_post_id     := (v_click.metadata->>'campaign_post_id')::uuid;
    END IF;
  END IF;
  IF v_campaign_id IS NULL THEN RETURN jsonb_build_object('attributed', false, 'reason', 'no_click_in_window'); END IF;
  INSERT INTO marketing.campaign_conversions (campaign_id, campaign_post_id, conversion_type, subject_id, subject_table, value_cents, user_id, metadata)
  VALUES (v_campaign_id, v_post_id, p_conversion_type, p_subject_id, p_subject_table, p_value_cents, p_user_id, COALESCE(p_metadata,'{}'))
  RETURNING id INTO v_conv_id;
  RETURN jsonb_build_object('attributed', true, 'conversion_id', v_conv_id, 'campaign_id', v_campaign_id, 'campaign_post_id', v_post_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_record_conversion(uuid,text,text,integer,uuid,jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_record_conversion(uuid,text,text,integer,uuid,jsonb) FROM anon, authenticated;

SELECT cron.schedule('campaign_conversions_rollup','15 3 * * *',$$
  INSERT INTO marketing.campaign_metrics (campaign_id, date, conversions, revenue_cents)
  SELECT campaign_id, attributed_at::date, COUNT(*), COALESCE(SUM(value_cents),0)
  FROM marketing.campaign_conversions WHERE attributed_at::date = CURRENT_DATE - 1
  GROUP BY campaign_id, attributed_at::date
  ON CONFLICT (campaign_id, date) DO UPDATE SET conversions=EXCLUDED.conversions, revenue_cents=EXCLUDED.revenue_cents;
$$);
