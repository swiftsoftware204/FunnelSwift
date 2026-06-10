-- Master Lead Tracking Table
-- Super Admin can see ALL leads across ALL tenants with their tags

CREATE TABLE master_lead_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead identification
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  tenant_name TEXT,
  
  -- Contact info (denormalized for reporting)
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  
  -- Source tracking
  source TEXT DEFAULT 'funnelswift', -- funnelswift, adaswift, missedcall, etc.
  source_details JSONB DEFAULT '{}',
  
  -- Tags applied (system and custom)
  system_tags TEXT[] DEFAULT '{}',
  custom_tags TEXT[] DEFAULT '{}',
  all_tags TEXT[] DEFAULT '{}', -- combined for easy searching
  
  -- Affiliate tracking
  referred_by_user_id UUID,
  referred_by_email TEXT,
  affiliate_code TEXT,
  
  -- Journey tracking
  entry_point TEXT, -- 'web_form', 'sms_keyword', 'missed_call', 'api', 'manual'
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Status
  current_status TEXT DEFAULT 'captured', -- captured, demoed, trialed, converted, churned
  
  -- Conversions
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(10,2),
  converted_to_software TEXT, -- which software they bought
  
  -- Campaign assignments (for email marketing)
  email_campaigns TEXT[] DEFAULT '{}', -- which campaigns they're in
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_master_leads_tenant ON master_lead_tracking(tenant_id);
CREATE INDEX idx_master_leads_email ON master_lead_tracking(email);
CREATE INDEX idx_master_leads_tags ON master_lead_tracking USING GIN(all_tags);
CREATE INDEX idx_master_leads_system_tags ON master_lead_tracking USING GIN(system_tags);
CREATE INDEX idx_master_leads_referred_by ON master_lead_tracking(referred_by_user_id);
CREATE INDEX idx_master_leads_status ON master_lead_tracking(current_status);
CREATE INDEX idx_master_leads_source ON master_lead_tracking(source);
CREATE INDEX idx_master_leads_created ON master_lead_tracking(created_at);

-- Enable RLS
ALTER TABLE master_lead_tracking ENABLE ROW LEVEL SECURITY;

-- Super Admin can see ALL leads
CREATE POLICY "Super admin can view all leads"
  ON master_lead_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Tenants can only see their own leads
CREATE POLICY "Tenants can view own leads"
  ON master_lead_tracking FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Function to update master tracking when contact changes
CREATE OR REPLACE FUNCTION update_master_lead_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO master_lead_tracking (
    contact_id,
    tenant_id,
    email,
    first_name,
    last_name,
    phone,
    company,
    all_tags,
    last_activity_at
  )
  VALUES (
    NEW.id,
    NEW.tenant_id,
    NEW.email,
    NEW.first_name,
    NEW.last_name,
    NEW.phone,
    NEW.company,
    NEW.tags,
    now()
  )
  ON CONFLICT (contact_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    all_tags = EXCLUDED.all_tags,
    last_activity_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep master tracking updated
CREATE TRIGGER contact_master_tracking
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_master_lead_tracking();

-- View for Super Admin dashboard
CREATE VIEW super_admin_lead_overview AS
SELECT
  mlt.*,
  st.display_name as primary_system_tag,
  st.target_software,
  st.target_action
FROM master_lead_tracking mlt
LEFT JOIN system_tags st ON st.tag_name = ANY(mlt.system_tags)
WHERE mlt.system_tags != '{}';
