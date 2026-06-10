-- Integration Events Schema
-- Cross-product event bus for SwiftSoftware ecosystem

-- ============================================
-- Create integration_events table
-- ============================================
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  target_products TEXT[] DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_events_source ON integration_events(source);
CREATE INDEX IF NOT EXISTS idx_integration_events_event_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_timestamp ON integration_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_integration_events_processed ON integration_events(processed);

-- Enable RLS
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to integration_events"
  ON integration_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Create workflow_triggers table
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  condition JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to workflow_triggers"
  ON workflow_triggers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Create webhook_configs table
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  secret_key TEXT,
  is_active BOOLEAN DEFAULT true,
  last_called_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to webhook_configs"
  ON webhook_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Create integration_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES integration_events(id),
  workflow_id UUID,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL, -- success, error, pending
  message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_logs_event_id ON integration_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);

-- Enable RLS
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to integration_logs"
  ON integration_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Function to update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflow_triggers
DROP TRIGGER IF EXISTS workflow_triggers_updated_at ON workflow_triggers;
CREATE TRIGGER workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Seed default webhook configs
-- ============================================
INSERT INTO webhook_configs (product, webhook_url, is_active) VALUES
  ('adaswift', 'https://app.adaswift.com/api/webhooks/funnelswift', true),
  ('missedcall', 'https://missedcall.example.com/api/webhooks/funnelswift', false),
  ('workflowswift', 'https://workflowswift.example.com/api/webhooks/funnelswift', false)
ON CONFLICT (product) DO NOTHING;

-- ============================================
-- Seed default workflow triggers
-- ============================================
INSERT INTO workflow_triggers (name, description, source, event_type, condition, actions, is_active) VALUES
  (
    'ADA Lead Magnet Delivery',
    'Automatically deliver ADA widget when lead is tagged',
    'funnelswift',
    'tag.assigned',
    '{"tags": ["ada-lead-magnet"]}'::jsonb,
    '[
      {
        "type": "api_call",
        "target": "adaswift",
        "endpoint": "/api/widgets/create",
        "payload": {"plan": "free_trial", "source": "funnelswift"}
      },
      {
        "type": "delay",
        "duration": "5m"
      },
      {
        "type": "tag_update",
        "payload": {"add_tags": ["ada-widget-sent"]}
      }
    ]'::jsonb,
    true
  ),
  (
    'Missed Call Demo Creation',
    'Create demo account for missed call responder',
    'funnelswift',
    'tag.assigned',
    '{"tags": ["missedcall-demo-request"]}'::jsonb,
    '[
      {
        "type": "api_call",
        "target": "missedcall",
        "endpoint": "/api/demo/create",
        "payload": {"trial_days": 14, "source": "funnelswift"}
      },
      {
        "type": "tag_update",
        "payload": {"add_tags": ["missedcall-demo-created"]}
      }
    ]'::jsonb,
    true
  ),
  (
    'Hot Lead Alert',
    'Alert when lead score is high',
    'funnelswift',
    'lead.scored',
    '{"min_score": 80}'::jsonb,
    '[
      {
        "type": "tag_update",
        "payload": {"add_tags": ["hot-lead", "priority-follow-up"]}
      }
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- Enable realtime for integration_events
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE integration_events;
