-- Campaign Assignments Table
-- Track which leads were sent to which campaigns/integrations

CREATE TABLE campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Lead info
  lead_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  lead_email TEXT,
  
  -- Campaign/Integration
  campaign_id UUID REFERENCES tenant_integrations(id),
  integration TEXT NOT NULL, -- 'sendiio', 'globalcontrol', 'mailchimp', etc.
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_campaign_assignments_tenant ON campaign_assignments(tenant_id);
CREATE INDEX idx_campaign_assignments_lead ON campaign_assignments(lead_id);
CREATE INDEX idx_campaign_assignments_campaign ON campaign_assignments(campaign_id);
CREATE INDEX idx_campaign_assignments_status ON campaign_assignments(status);

-- Enable RLS
ALTER TABLE campaign_assignments ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own assignments
CREATE POLICY "Tenants can view own campaign assignments"
  ON campaign_assignments FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Super admin can view all
CREATE POLICY "Super admin can view all campaign assignments"
  ON campaign_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));
