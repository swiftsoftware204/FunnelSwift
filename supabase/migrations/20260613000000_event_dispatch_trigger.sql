-- Create function to dispatch events via HTTP trigger
CREATE OR REPLACE FUNCTION public.dispatch_event_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function via pg_net (if available) or trigger notification
  -- For now, we'll use a trigger that the edge function can listen to
  PERFORM pg_notify('new_event', json_build_object(
    'event_id', NEW.id,
    'event_type', NEW.event_type,
    'contact_id', NEW.contact_id,
    'source_app', NEW.source_app
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on events table
DROP TRIGGER IF EXISTS trigger_dispatch_event ON public.events;
CREATE TRIGGER trigger_dispatch_event
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_event_webhook();

-- Add comment for documentation
COMMENT ON FUNCTION public.dispatch_event_webhook() IS 
  'Automatically dispatches events to configured webhooks via pg_notify';
