-- =============================================================
-- REALTIME-P2: Broadcast trigger for messages (chat)
-- =============================================================
-- This trigger broadcasts INSERT/UPDATE/DELETE on messages to 
-- conversation-scoped topics for live chat functionality

-- Create trigger function for messages broadcast
CREATE OR REPLACE FUNCTION public.broadcast_messages_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation_id uuid;
  _topic text;
BEGIN
  -- Get conversation_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    _conversation_id := OLD.conversation_id;
  ELSE
    _conversation_id := NEW.conversation_id;
  END IF;
  
  -- Build topic: conversation:{id}:messages
  _topic := 'conversation:' || _conversation_id::text || ':messages';
  
  -- Broadcast the change using realtime.broadcast_changes
  PERFORM realtime.broadcast_changes(
    _topic,           -- topic
    TG_OP,            -- event (INSERT, UPDATE, DELETE)
    TG_OP,            -- operation
    TG_TABLE_NAME,    -- table
    TG_TABLE_SCHEMA,  -- schema
    NEW,              -- new record
    OLD               -- old record
  );
  
  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_messages_broadcast ON public.messages;
CREATE TRIGGER trigger_messages_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_messages_changes();

-- =============================================================
-- REALTIME-P3: Broadcast triggers for trip_items and trips
-- =============================================================

-- Create trigger function for trip_items broadcast
CREATE OR REPLACE FUNCTION public.broadcast_trip_items_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trip_id uuid;
  _topic text;
BEGIN
  -- Get trip_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    _trip_id := OLD.trip_id;
  ELSE
    _trip_id := NEW.trip_id;
  END IF;
  
  -- Build topic: trip:{id}:items
  _topic := 'trip:' || _trip_id::text || ':items';
  
  -- Broadcast the change
  PERFORM realtime.broadcast_changes(
    _topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on trip_items table
DROP TRIGGER IF EXISTS trigger_trip_items_broadcast ON public.trip_items;
CREATE TRIGGER trigger_trip_items_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON public.trip_items
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_trip_items_changes();

-- Create trigger function for trips broadcast (meta changes)
CREATE OR REPLACE FUNCTION public.broadcast_trips_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trip_id uuid;
  _topic text;
BEGIN
  -- Get trip_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    _trip_id := OLD.id;
  ELSE
    _trip_id := NEW.id;
  END IF;
  
  -- Build topic: trip:{id}:meta
  _topic := 'trip:' || _trip_id::text || ':meta';
  
  -- Broadcast the change
  PERFORM realtime.broadcast_changes(
    _topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on trips table
DROP TRIGGER IF EXISTS trigger_trips_broadcast ON public.trips;
CREATE TRIGGER trigger_trips_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_trips_changes();

-- =============================================================
-- REALTIME-P4: Broadcast trigger for agent_jobs
-- =============================================================

-- Create trigger function for agent_jobs broadcast
CREATE OR REPLACE FUNCTION public.broadcast_agent_jobs_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job_id uuid;
  _topic text;
  _safe_payload jsonb;
BEGIN
  -- Get job_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    _job_id := OLD.id;
  ELSE
    _job_id := NEW.id;
  END IF;
  
  -- Build topic: job:{id}:status
  _topic := 'job:' || _job_id::text || ':status';
  
  -- Build safe payload (exclude sensitive fields like input_json, result_json)
  IF TG_OP != 'DELETE' THEN
    _safe_payload := jsonb_build_object(
      'id', NEW.id,
      'status', NEW.status,
      'progress', NEW.progress,
      'current_step', NEW.current_step,
      'total_steps', NEW.total_steps,
      'error', NEW.error,
      'started_at', NEW.started_at,
      'completed_at', NEW.completed_at
    );
  ELSE
    _safe_payload := jsonb_build_object(
      'id', OLD.id,
      'status', 'deleted'
    );
  END IF;
  
  -- Broadcast using realtime.send for custom payload
  PERFORM realtime.send(
    _safe_payload,
    'job_status_changed',
    _topic,
    TRUE  -- private channel
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on agent_jobs table
DROP TRIGGER IF EXISTS trigger_agent_jobs_broadcast ON public.agent_jobs;
CREATE TRIGGER trigger_agent_jobs_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_agent_jobs_changes();

-- =============================================================
-- REALTIME-P5: RLS policies on realtime.messages
-- =============================================================
-- These policies control who can subscribe to private channels

-- Enable RLS on realtime.messages if not already enabled
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing ILM policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "ilm_realtime_select_conversation_trip_job_user" ON realtime.messages;
DROP POLICY IF EXISTS "ilm_realtime_insert_conversation_trip_broadcast" ON realtime.messages;

-- SELECT policy: Users can subscribe to their own resources
CREATE POLICY "ilm_realtime_select_conversation_trip_job_user"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only for broadcast/presence extensions
  extension IN ('broadcast', 'presence')
  AND (
    -- conversation:{id}:messages - user owns the conversation
    (
      realtime.topic() LIKE 'conversation:%'
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = (split_part(realtime.topic(), ':', 2))::uuid
          AND c.user_id = auth.uid()
      )
    )
    OR
    -- trip:{id}:items or trip:{id}:meta - user owns the trip
    (
      realtime.topic() LIKE 'trip:%'
      AND EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = (split_part(realtime.topic(), ':', 2))::uuid
          AND t.user_id = auth.uid()
      )
    )
    OR
    -- job:{id}:status - user owns the job
    (
      realtime.topic() LIKE 'job:%'
      AND EXISTS (
        SELECT 1 FROM public.agent_jobs j
        WHERE j.id = (split_part(realtime.topic(), ':', 2))::uuid
          AND j.user_id = auth.uid()
      )
    )
    OR
    -- user:{id}:* - user's own notifications
    (
      realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
    )
  )
);

-- INSERT policy: Users can send broadcasts to conversations/trips they own
CREATE POLICY "ilm_realtime_insert_conversation_trip_broadcast"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension IN ('broadcast', 'presence')
  AND (
    -- conversation:{id}:messages - user owns the conversation
    (
      realtime.topic() LIKE 'conversation:%'
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = (split_part(realtime.topic(), ':', 2))::uuid
          AND c.user_id = auth.uid()
      )
    )
    OR
    -- trip:{id}:* - user owns the trip
    (
      realtime.topic() LIKE 'trip:%'
      AND EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = (split_part(realtime.topic(), ':', 2))::uuid
          AND t.user_id = auth.uid()
      )
    )
  )
);

-- =============================================================
-- REALTIME-P9 (Optional): Proactive suggestions trigger
-- =============================================================

-- Create trigger function for proactive_suggestions broadcast
CREATE OR REPLACE FUNCTION public.broadcast_suggestions_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _topic text;
  _safe_payload jsonb;
BEGIN
  -- Get user_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    _user_id := OLD.user_id;
  ELSE
    _user_id := NEW.user_id;
  END IF;
  
  -- Build topic: user:{id}:notifications
  _topic := 'user:' || _user_id::text || ':notifications';
  
  -- Build safe payload
  IF TG_OP = 'DELETE' THEN
    _safe_payload := jsonb_build_object(
      'id', OLD.id,
      'event', 'suggestion_deleted'
    );
  ELSE
    _safe_payload := jsonb_build_object(
      'id', NEW.id,
      'type', NEW.type,
      'title', NEW.title,
      'description', NEW.description,
      'priority', NEW.priority,
      'action_url', NEW.action_url,
      'event', CASE 
        WHEN TG_OP = 'INSERT' THEN 'suggestion_created'
        ELSE 'suggestion_updated'
      END
    );
  END IF;
  
  -- Broadcast using realtime.send
  PERFORM realtime.send(
    _safe_payload,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'suggestion_created'
      WHEN TG_OP = 'UPDATE' THEN 'suggestion_updated'
      ELSE 'suggestion_deleted'
    END,
    _topic,
    TRUE  -- private channel
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on proactive_suggestions table
DROP TRIGGER IF EXISTS trigger_suggestions_broadcast ON public.proactive_suggestions;
CREATE TRIGGER trigger_suggestions_broadcast
  AFTER INSERT OR UPDATE OR DELETE ON public.proactive_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_suggestions_changes();