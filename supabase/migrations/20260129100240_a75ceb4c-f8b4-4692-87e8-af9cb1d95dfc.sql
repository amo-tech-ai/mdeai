-- Create broadcast function for proactive_suggestions
CREATE OR REPLACE FUNCTION public.broadcast_proactive_suggestions_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  topic text;
BEGIN
  -- Build topic using user_id
  IF TG_OP = 'DELETE' THEN
    topic := 'user:' || OLD.user_id::text || ':notifications';
    payload := jsonb_build_object(
      'type', 'broadcast',
      'event', 'DELETE',
      'table', 'proactive_suggestions',
      'id', OLD.id,
      'user_id', OLD.user_id
    );
  ELSE
    topic := 'user:' || NEW.user_id::text || ':notifications';
    payload := jsonb_build_object(
      'type', 'broadcast',
      'event', TG_OP,
      'table', 'proactive_suggestions',
      'id', NEW.id,
      'user_id', NEW.user_id,
      'record', jsonb_build_object(
        'id', NEW.id,
        'type', NEW.type,
        'title', NEW.title,
        'description', NEW.description,
        'status', NEW.status,
        'priority', NEW.priority,
        'action_url', NEW.action_url,
        'trip_id', NEW.trip_id,
        'created_at', NEW.created_at
      )
    );
  END IF;

  -- Broadcast to private channel
  PERFORM pg_notify('realtime:broadcast', json_build_object(
    'topic', topic,
    'event', 'notification_' || lower(TG_OP),
    'payload', payload
  )::text);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for proactive_suggestions
DROP TRIGGER IF EXISTS trigger_broadcast_proactive_suggestions ON public.proactive_suggestions;

CREATE TRIGGER trigger_broadcast_proactive_suggestions
AFTER INSERT OR UPDATE OR DELETE ON public.proactive_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_proactive_suggestions_changes();