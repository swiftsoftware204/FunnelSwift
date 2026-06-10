-- Team/Sub-user Access System
-- Plan-based feature toggle for team collaboration

-- ============================================
-- Team Members Table
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization (tenant)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- User info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Role & Permissions
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'manager', 'member', 'viewer'
  
  -- Permissions (JSON for flexibility)
  permissions JSONB DEFAULT '{
    "leads": {"view": true, "create": true, "edit": true, "delete": false},
    "campaigns": {"view": true, "create": false, "edit": false, "delete": false},
    "integrations": {"view": true, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "edit": false},
    "billing": {"view": false, "edit": false},
    "team": {"view": false, "edit": false}
  }'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'invited', 'suspended', 'removed'
  
  -- Invitation
  invitation_token TEXT,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  
  -- Tracking
  invited_by UUID REFERENCES auth.users(id),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_status ON team_members(status);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view own tenant team"
  ON team_members FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY "Owners and admins can manage team"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.tenant_id = current_setting('app.current_tenant')::UUID
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.status = 'active'
    )
  );

-- ============================================
-- Role Definitions (Default Permissions)
-- ============================================
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO team_roles (name, display_name, description, permissions, is_system) VALUES
('owner', 'Owner', 'Full access to everything', '{
  "leads": {"view": true, "create": true, "edit": true, "delete": true},
  "campaigns": {"view": true, "create": true, "edit": true, "delete": true},
  "integrations": {"view": true, "create": true, "edit": true, "delete": true},
  "settings": {"view": true, "edit": true},
  "billing": {"view": true, "edit": true},
  "team": {"view": true, "edit": true}
}'::jsonb, true),

('admin', 'Admin', 'Can manage most things except billing', '{
  "leads": {"view": true, "create": true, "edit": true, "delete": true},
  "campaigns": {"view": true, "create": true, "edit": true, "delete": true},
  "integrations": {"view": true, "create": true, "edit": true, "delete": true},
  "settings": {"view": true, "edit": true},
  "billing": {"view": true, "edit": false},
  "team": {"view": true, "edit": true}
}'::jsonb, true),

('manager', 'Manager', 'Can manage leads and campaigns', '{
  "leads": {"view": true, "create": true, "edit": true, "delete": true},
  "campaigns": {"view": true, "create": true, "edit": true, "delete": false},
  "integrations": {"view": true, "create": false, "edit": false, "delete": false},
  "settings": {"view": true, "edit": false},
  "billing": {"view": false, "edit": false},
  "team": {"view": true, "edit": false}
}'::jsonb, true),

('member', 'Member', 'Can view and create leads', '{
  "leads": {"view": true, "create": true, "edit": true, "delete": false},
  "campaigns": {"view": true, "create": false, "edit": false, "delete": false},
  "integrations": {"view": true, "create": false, "edit": false, "delete": false},
  "settings": {"view": false, "edit": false},
  "billing": {"view": false, "edit": false},
  "team": {"view": false, "edit": false}
}'::jsonb, true),

('viewer', 'Viewer', 'View-only access', '{
  "leads": {"view": true, "create": false, "edit": false, "delete": false},
  "campaigns": {"view": true, "create": false, "edit": false, "delete": false},
  "integrations": {"view": true, "create": false, "edit": false, "delete": false},
  "settings": {"view": false, "edit": false},
  "billing": {"view": false, "edit": false},
  "team": {"view": false, "edit": false}
}'::jsonb, true);

-- ============================================
-- Update Plans Table with Team Limits
-- ============================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS team_members_allowed INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS team_members_unlimited BOOLEAN DEFAULT false;

-- Update existing plans with team limits
UPDATE plans SET 
  team_members_allowed = 1,
  team_members_unlimited = false
WHERE slug = 'demo';

UPDATE plans SET 
  team_members_allowed = 3,
  team_members_unlimited = false
WHERE slug = 'starter';

UPDATE plans SET 
  team_members_allowed = 10,
  team_members_unlimited = false
WHERE slug = 'professional';

UPDATE plans SET 
  team_members_allowed = 0,
  team_members_unlimited = true
WHERE slug = 'enterprise';

-- ============================================
-- Function to Check Team Access
-- ============================================
CREATE OR REPLACE FUNCTION can_add_team_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_record RECORD;
  v_current_members INTEGER;
  v_user_plan TEXT;
BEGIN
  -- Get user's plan
  SELECT p.slug, p.team_members_allowed, p.team_members_unlimited
  INTO v_plan_record
  FROM tenants t
  JOIN plans p ON t.plan_id = p.id
  WHERE t.id = p_tenant_id;
  
  -- Check if unlimited
  IF v_plan_record.team_members_unlimited THEN
    RETURN true;
  END IF;
  
  -- Count current active team members
  SELECT COUNT(*) INTO v_current_members
  FROM team_members
  WHERE tenant_id = p_tenant_id
  AND status = 'active';
  
  -- Check if under limit
  RETURN v_current_members < v_plan_record.team_members_allowed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Activity Log for Team Actions
-- ============================================
CREATE TABLE team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'create_lead', 'update_contact', 'delete_campaign', etc.
  entity_type TEXT, -- 'lead', 'contact', 'campaign', 'integration'
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_team_activity_tenant ON team_activity_log(tenant_id);
CREATE INDEX idx_team_activity_user ON team_activity_log(user_id);
CREATE INDEX idx_team_activity_created ON team_activity_log(created_at);

ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own tenant activity"
  ON team_activity_log FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================
-- Super Admin Team Override
-- ============================================
CREATE POLICY "Super admin can manage all teams"
  ON team_members FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "Super admin can view all activity"
  ON team_activity_log FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));
