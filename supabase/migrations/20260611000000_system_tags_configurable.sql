-- Configurable System Tags (Super Admin controlled)
-- Instead of hardcoded in code, stored in database

CREATE TABLE system_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tag details
  tag_name TEXT UNIQUE NOT NULL, -- 'ada-lead-magnet', 'missedcall-demo-request', etc.
  display_name TEXT NOT NULL, -- 'ADA Widget Lead Magnet'
  description TEXT,
  
  -- Integration it triggers
  target_software TEXT NOT NULL, -- 'adaswift', 'missedcall', 'workflowswift', 'sendiio', etc.
  target_action TEXT NOT NULL, -- 'create_demo', 'start_campaign', 'add_to_list', etc.
  
  -- Visual
  color TEXT DEFAULT 'blue', -- blue, green, red, yellow, purple
  icon TEXT, -- emoji or icon name
  
  -- Behavior
  is_active BOOLEAN DEFAULT true,
  auto_trigger BOOLEAN DEFAULT true, -- automatically trigger on tag assignment
  
  -- For affiliate tracking
  is_commissionable BOOLEAN DEFAULT true,
  commission_type TEXT DEFAULT 'percentage', -- percentage, flat
  commission_amount DECIMAL(10,2) DEFAULT 30.00,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default system tags (Super Admin can edit/add/remove)
INSERT INTO system_tags (tag_name, display_name, description, target_software, target_action, color, icon, commission_amount) VALUES
('ada-lead-magnet', 'ADA Widget Lead Magnet', 'Triggers ADA widget demo creation', 'adaswift', 'create_demo', 'blue', '🎯', 30.00),
('ada-widget-sent', 'ADA Widget Delivered', 'Widget has been delivered to prospect', 'adaswift', 'mark_delivered', 'green', '✅', 0),
('missedcall-demo-request', 'MissedCall Demo Request', 'Triggers MissedCall SMS demo', 'missedcall', 'create_demo', 'purple', '📞', 30.00),
('missedcall-demo-active', 'MissedCall Demo Active', 'Demo account is active', 'missedcall', 'mark_active', 'green', '✅', 0),
('workflowswift-trial', 'WorkflowSwift Trial', 'Triggers WorkflowSwift trial', 'workflowswift', 'create_trial', 'orange', '⚡', 30.00),
('workflowswift-active', 'WorkflowSwift Active', 'Trial converted to paid', 'workflowswift', 'mark_converted', 'green', '✅', 0),
('hot-lead', 'Hot Lead', 'High priority lead for follow-up', 'internal', 'alert_sales', 'red', '🔥', 0),
('priority-follow-up', 'Priority Follow-Up', 'Requires immediate attention', 'internal', 'create_task', 'yellow', '⚠️', 0),
('demo-completed', 'Demo Completed', 'Prospect completed demo', 'internal', 'mark_qualified', 'green', '🎉', 0),
('contract-sent', 'Contract Sent', 'Contract sent for signature', 'internal', 'track_contract', 'blue', '📄', 0),
('closed-won', 'Closed Won', 'Deal closed successfully', 'internal', 'mark_won', 'green', '💰', 50.00),
('closed-lost', 'Closed Lost', 'Deal lost', 'internal', 'mark_lost', 'gray', '❌', 0);

-- Enable RLS
ALTER TABLE system_tags ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage all system tags
CREATE POLICY "Super admin can manage system tags"
  ON system_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Everyone can view active system tags
CREATE POLICY "Everyone can view active system tags"
  ON system_tags FOR SELECT
  USING (is_active = true);

-- Trigger to update timestamps
CREATE TRIGGER system_tags_updated_at
  BEFORE UPDATE ON system_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for performance
CREATE INDEX idx_system_tags_active ON system_tags(is_active);
CREATE INDEX idx_system_tags_software ON system_tags(target_software);
