-- ============================================
-- ADASwift Automation Trigger
-- Calls webhook when ada-lead-magnet tag is applied
-- ============================================

-- Function to trigger ADASwift webhook
CREATE OR REPLACE FUNCTION trigger_adaswift_on_tag()
RETURNS TRIGGER AS $$
DECLARE
  contact_record RECORD;
  tag_name TEXT;
BEGIN
  -- Get the tag name
  SELECT t.name INTO tag_name
  FROM tags t
  WHERE t.id = NEW.tag_id;
  
  -- Only trigger for ada-lead-magnet tag
  IF tag_name = 'ada-lead-magnet' THEN
    -- Get contact details
    SELECT * INTO contact_record
    FROM contacts
    WHERE id = NEW.contact_id;
    
    -- Call the webhook endpoint (using pg_http extension if available)
    -- For now, we'll use a queue table approach
    INSERT INTO webhook_queue (
      endpoint,
      payload,
      status
    )
    VALUES (
      'adaswift',
      jsonb_build_object(
        'event', 'create_client',
        'contact_id', contact_record.id,
        'email', contact_record.email,
        'first_name', contact_record.first_name,
        'last_name', contact_record.last_name,
        'phone', contact_record.phone,
        'company', contact_record.company,
        'website_url', contact_record.website_url,
        'tracking_id', contact_record.funnelswift_tracking_id,
        'referred_by', contact_record.referred_by_user_id
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create webhook queue table if not exists
CREATE TABLE IF NOT EXISTS webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_webhook_queue_status ON webhook_queue(status);

-- Create trigger on contact_tags
DROP TRIGGER IF EXISTS trigger_adaswift_tag ON contact_tags;
CREATE TRIGGER trigger_adaswift_tag
  AFTER INSERT ON contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION trigger_adaswift_on_tag();

-- Enable RLS
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Super admin can manage webhook queue"
  ON webhook_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

SELECT 'ADASwift automation trigger created' as status;
