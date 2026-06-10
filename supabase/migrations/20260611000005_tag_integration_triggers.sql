-- Tag Integration Triggers System
-- Every tag can trigger multiple integrations automatically

-- ============================================
-- Tag Integration Rules Table
-- ============================================
CREATE TABLE tag_integration_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- The tag that triggers this
  tag_name TEXT NOT NULL,
  
  -- Integration to trigger
  integration_id UUID REFERENCES tenant_integrations(id),
  integration_type TEXT NOT NULL, -- 'sendiio', 'globalcontrol', 'mailchimp', etc.
  
  -- Rule settings
  action TEXT DEFAULT 'add_to_list', -- 'add_to_list', 'add_tag', 'start_campaign', etc.
  target_list_id TEXT, -- List/campaign ID in the integration
  additional_tags TEXT[] DEFAULT '{}', -- Extra tags to add
  
  -- Who created this rule
  created_by TEXT DEFAULT 'system', -- 'system' for hardcoded, 'user' for custom
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique: one rule per tag per integration per tenant
CREATE UNIQUE INDEX idx_tag_integration_rules_unique 
  ON tag_integration_rules(tag_name, integration_id, tenant_id);

CREATE INDEX idx_tag_integration_rules_tag ON tag_integration_rules(tag_name);
CREATE INDEX idx_tag_integration_rules_tenant ON tag_integration_rules(tenant_id);
CREATE INDEX idx_tag_integration_rules_active ON tag_integration_rules(is_active);

-- ============================================
-- Hardcoded System Rules (Auto-created for Super Admin)
-- ============================================
-- These are default rules that apply to hardcoded tags
-- Super Admin can modify them

CREATE TABLE system_tag_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tag_name TEXT NOT NULL UNIQUE,
  
  -- Default integrations to trigger
  default_integrations JSONB DEFAULT '[]', -- [{"type": "sendiio", "list_id": "xxx"}]
  
  -- Super Admin settings
  auto_assign_to_super_admin BOOLEAN DEFAULT true,
  super_admin_integration_settings JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default rules for hardcoded tags
INSERT INTO system_tag_rules (tag_name, default_integrations, auto_assign_to_super_admin) VALUES
('ada-lead-magnet', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('missedcall-demo-request', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('workflowswift-trial', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('funnelswift-demo', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('funnelswift-starter', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('funnelswift-pro', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('funnelswift-enterprise', '[{"type": "sendiio", "action": "add_to_list"}]', true),
('hot-lead', '[{"type": "sendiio", "action": "add_tag"}]', true),
('closed-won', '[{"type": "sendiio", "action": "add_tag"}]', true);

-- ============================================
-- Function to auto-trigger integrations when tag is added
-- ============================================
CREATE OR REPLACE FUNCTION trigger_integrations_on_tag()
RETURNS TRIGGER AS $$
DECLARE
  rule RECORD;
  integration_record RECORD;
  super_admin_settings JSONB;
BEGIN
  -- Check for tenant-specific rules
  FOR rule IN 
    SELECT * FROM tag_integration_rules 
    WHERE tag_name = NEW.tag 
    AND tenant_id = NEW.tenant_id
    AND is_active = true
  LOOP
    -- Trigger the integration (via webhook/edge function)
    PERFORM net.http_post(
      url := 'https://funnelswift.netlify.app/api/trigger-integration',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'contact_id', NEW.contact_id,
        'tag', NEW.tag,
        'integration_id', rule.integration_id,
        'action', rule.action,
        'target_list_id', rule.target_list_id,
        'additional_tags', rule.additional_tags
      )
    );
  END LOOP;
  
  -- Check for system rules (hardcoded tags)
  FOR rule IN 
    SELECT * FROM system_tag_rules 
    WHERE tag_name = NEW.tag 
    AND is_active = true
    AND auto_assign_to_super_admin = true
  LOOP
    -- Get Super Admin's integration settings
    SELECT integration_settings INTO super_admin_settings
    FROM super_admin_settings
    WHERE id = 1;
    
    -- Trigger Super Admin's integrations
    IF super_admin_settings IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://funnelswift.netlify.app/api/trigger-super-admin-integration',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'contact_id', NEW.contact_id,
          'tag', NEW.tag,
          'settings', super_admin_settings
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on contact_tags table
CREATE TRIGGER auto_trigger_integrations_on_tag
  AFTER INSERT ON contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION trigger_integrations_on_tag();

-- ============================================
-- Super Admin Settings Table
-- ============================================
CREATE TABLE super_admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Super Admin's default integrations
  integration_settings JSONB DEFAULT '{
    "sendiio": {"api_key": "", "default_list_id": ""},
    "globalcontrol": {"api_key": "", "api_url": ""}
  }',
  
  -- Which hardcoded tags auto-trigger for Super Admin
  auto_trigger_tags TEXT[] DEFAULT '{ada-lead-magnet,missedcall-demo-request,workflowswift-trial,funnelswift-demo,funnelswift-starter,funnelswift-pro,funnelswift-enterprise}',
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO super_admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE tag_integration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_tag_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_settings ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own rules
CREATE POLICY "Tenants can manage own tag integration rules"
  ON tag_integration_rules FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Super Admin can manage system rules
CREATE POLICY "Super admin can manage system tag rules"
  ON system_tag_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Super Admin can manage settings
CREATE POLICY "Super admin can manage settings"
  ON super_admin_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Everyone can view active system rules
CREATE POLICY "Everyone can view system tag rules"
  ON system_tag_rules FOR SELECT
  USING (is_active = true);
