-- 25AC: event_wait_list — sold-out ticket waitlist with auto-notify
-- Position-ordered per ticket_type; 30-min hold window; cron advances on expiry.

CREATE TABLE public.event_wait_list (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id  uuid        NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text        NOT NULL,
  phone           text,
  position        integer     NOT NULL,
  status          text        NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','notified','claimed','expired','removed')),
  notified_at     timestamptz,
  hold_expires_at timestamptz,
  claimed_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_type_id, user_id),
  UNIQUE (ticket_type_id, position)
);
CREATE INDEX event_wait_list_ticket_status_pos ON public.event_wait_list (ticket_type_id, status, position) WHERE status = 'waiting';
CREATE INDEX event_wait_list_hold_expires ON public.event_wait_list (hold_expires_at) WHERE status = 'notified';
ALTER TABLE public.event_wait_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_wait_list"     ON public.event_wait_list FOR ALL TO anon         USING (false);
CREATE POLICY "service_role_full_wait_list" ON public.event_wait_list FOR ALL TO service_role  USING (true) WITH CHECK (true);
CREATE POLICY "users_see_own_wait_list"    ON public.event_wait_list FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "users_join_wait_list"       ON public.event_wait_list FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "users_remove_themselves"    ON public.event_wait_list FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (status = 'removed');
COMMENT ON TABLE public.event_wait_list IS 'Sold-out ticket waitlist. Position-ordered per ticket_type; auto-notified on cancellation with 30-min hold.';

CREATE OR REPLACE FUNCTION public.fn_join_wait_list(p_ticket_type_id uuid, p_user_id uuid, p_email text, p_phone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_event_id uuid; v_position integer; v_id uuid;
BEGIN
  SELECT event_id INTO v_event_id FROM public.event_tickets WHERE id = p_ticket_type_id;
  IF v_event_id IS NULL THEN RETURN jsonb_build_object('joined', false, 'error', 'ticket_type_not_found'); END IF;
  IF EXISTS (SELECT 1 FROM public.event_wait_list WHERE ticket_type_id = p_ticket_type_id AND user_id = p_user_id AND status NOT IN ('expired','removed')) THEN
    SELECT position INTO v_position FROM public.event_wait_list WHERE ticket_type_id = p_ticket_type_id AND user_id = p_user_id AND status NOT IN ('expired','removed');
    RETURN jsonb_build_object('joined', false, 'already_on_list', true, 'position', v_position);
  END IF;
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position FROM public.event_wait_list WHERE ticket_type_id = p_ticket_type_id AND status = 'waiting';
  INSERT INTO public.event_wait_list (event_id, ticket_type_id, user_id, email, phone, position) VALUES (v_event_id, p_ticket_type_id, p_user_id, p_email, p_phone, v_position) RETURNING id INTO v_id;
  RETURN jsonb_build_object('joined', true, 'position', v_position, 'id', v_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_join_wait_list(uuid,uuid,text,text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.fn_join_wait_list(uuid,uuid,text,text) FROM anon;

CREATE OR REPLACE FUNCTION public.fn_notify_next_in_line(p_ticket_type_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_row public.event_wait_list%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.event_wait_list WHERE ticket_type_id = p_ticket_type_id AND status = 'waiting' ORDER BY position ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF v_row.id IS NULL THEN RETURN jsonb_build_object('notified', false, 'reason', 'empty_queue'); END IF;
  UPDATE public.event_wait_list SET status='notified', notified_at=pg_catalog.now(), hold_expires_at=pg_catalog.now()+interval '30 minutes' WHERE id = v_row.id;
  INSERT INTO public.notifications (user_id, type, payload) VALUES (v_row.user_id, 'wait_list_spot_available', jsonb_build_object('ticket_type_id', v_row.ticket_type_id, 'event_id', v_row.event_id, 'expires_at', (pg_catalog.now()+interval '30 minutes'))) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('notified', true, 'user_id', v_row.user_id, 'email', v_row.email);
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_notify_next_in_line(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_notify_next_in_line(uuid) FROM anon, authenticated;

SELECT cron.schedule('wait_list_expire_holds','*/5 * * * *',$$
  UPDATE public.event_wait_list SET status='expired' WHERE status='notified' AND hold_expires_at < pg_catalog.now();
  SELECT public.fn_notify_next_in_line(ticket_type_id) FROM (SELECT DISTINCT ticket_type_id FROM public.event_wait_list WHERE status='expired' AND notified_at > pg_catalog.now()-interval '6 minutes') t;
$$);
