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
  
  -- Commission by plan tier (Super Admin adjustable)
  commission_demo DECIMAL(10,2) DEFAULT 20.00,    -- Free/Demo users
  commission_starter DECIMAL(10,2) DEFAULT 25.00, -- Starter plan
  commission_pro DECIMAL(10,2) DEFAULT 30.00,     -- Professional plan
  commission_enterprise DECIMAL(10,2) DEFAULT 35.00, -- Enterprise plan
  
  -- For marketplace display
  pricing_range TEXT, -- '$29-$199/mo' or 'Contact for pricing'
  sales_page_url TEXT, -- Link to sales page
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Hardcoded protection (cannot be deleted if true)
  is_hardcoded BOOLEAN DEFAULT false
);

-- Insert default system tags (HARDCODED = cannot be deleted)
-- ONE tag per offer - simplified
INSERT INTO system_tags (tag_name, display_name, description, target_software, target_action, color, icon, commission_amount, is_hardcoded) VALUES
('ada-demo', 'ADA Demo', 'Triggers ADA widget demo creation', 'adaswift', 'create_demo', 'blue', '🎯', 30.00, true),
('missedcall-demo', 'MissedCall Demo', 'Triggers MissedCall SMS demo', 'missedcall', 'create_demo', 'purple', '📞', 30.00, true),
('workflowswift-demo', 'WorkflowSwift Demo', 'Triggers WorkflowSwift trial', 'workflowswift', 'create_demo', 'orange', '⚡', 30.00, true),
('funnelswift-demo', 'FunnelSwift Demo', 'Triggers FunnelSwift demo', 'funnelswift', 'create_demo', 'green', '🚀', 30.00, true);

-- Note: Super Admin can add more tags anytime via Settings → System Tags

-- Enable RLS
ALTER TABLE system_tags ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage all system tags EXCEPT hardcoded ones cannot be deleted
CREATE POLICY "Super admin can manage system tags"
  ON system_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true))
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true)
    AND (
      -- Allow if not trying to delete a hardcoded tag
      (SELECT is_hardcoded FROM system_tags WHERE id = id) = false
      OR (SELECT is_hardcoded FROM system_tags WHERE id = id) IS NULL
    )
  );

-- Prevent deletion of hardcoded tags
CREATE POLICY "Cannot delete hardcoded system tags"
  ON system_tags FOR DELETE
  USING (is_hardcoded = false OR is_hardcoded IS NULL);

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
