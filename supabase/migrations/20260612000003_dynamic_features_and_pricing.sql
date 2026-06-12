-- ============================================
-- DYNAMIC FEATURE TOGGLES + PRICING
-- Every feature has a toggle, pricing is fully editable
-- ============================================

-- ============================================
-- 1. FEATURE DEFINITIONS TABLE
-- Master list of all possible features in FunnelSwift
-- ============================================

CREATE TABLE IF NOT EXISTS feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Feature identification
  key TEXT UNIQUE NOT NULL, -- machine-readable: 'contacts', 'lead_forms', etc.
  name TEXT NOT NULL, -- human-readable: 'Contact Management'
  description TEXT,
  category TEXT NOT NULL, -- 'core', 'advanced', 'automation', 'integrations', 'affiliate'
  
  -- Display
  icon TEXT DEFAULT 'check',
  sort_order INTEGER DEFAULT 0,
  
  -- Default limits (can be overridden per plan)
  default_limit INTEGER DEFAULT -1, -- -1 = unlimited, 0 = not included, >0 = specific limit
  
  -- Is this a core feature that can't be disabled?
  is_core BOOLEAN DEFAULT false,
  
  -- For features with numeric limits
  unit_label TEXT DEFAULT '', -- 'contacts', 'forms', 'workflows', etc.
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert ALL FunnelSwift features
INSERT INTO feature_definitions (key, name, description, category, icon, sort_order, default_limit, unit_label, is_core) VALUES
-- CORE FEATURES (always available)
('contacts', 'Contact Management', 'Store and manage leads', 'core', 'users', 10, 100, 'contacts', true),
('tags', 'Lead Tagging', 'Tag and organize leads', 'core', 'tag', 20, -1, '', true),
('pipelines', 'Sales Pipelines', 'Visual deal tracking', 'core', 'pipeline', 30, 1, 'pipelines', true),
('notes', 'Contact Notes', 'Add notes to contacts', 'core', 'file-text', 40, -1, '', true),

-- LEAD CAPTURE
('lead_forms', 'Lead Forms', 'Create embeddable forms', 'capture', 'layout', 50, 1, 'forms', false),
('form_customization', 'Form Customization', 'Customize form styling', 'capture', 'palette', 60, 0, '', false),
('form_branding', 'Remove Branding', 'Remove FunnelSwift branding', 'capture', 'eye-off', 70, 0, '', false),
('file_uploads', 'File Uploads', 'Allow file uploads on forms', 'capture', 'upload', 80, 0, '', false),
('webhooks', 'Form Webhooks', 'Send form data to external URLs', 'capture', 'webhook', 90, 0, '', false),

-- AUTOMATION
('workflows', 'Workflow Automation', 'Automate lead nurturing', 'automation', 'zap', 100, 0, 'workflows', false),
('workflow_templates', 'Workflow Templates', 'Pre-built workflow templates', 'automation', 'copy', 110, 0, '', false),
('scheduled_emails', 'Scheduled Emails', 'Time-delayed email sequences', 'automation', 'clock', 120, 0, '', false),
('conditional_logic', 'Conditional Logic', 'If/then automation rules', 'automation', 'git-branch', 130, 0, '', false),

-- EMAIL & COMMUNICATION
('email_notifications', 'Email Notifications', 'Get notified of new leads', 'communication', 'mail', 140, -1, '', true),
('bulk_email', 'Bulk Email', 'Send emails to multiple contacts', 'communication', 'send', 150, 0, '', false),
('email_templates', 'Email Templates', 'Save reusable email templates', 'communication', 'file-text', 160, 0, '', false),
('sms_notifications', 'SMS Notifications', 'SMS alerts for new leads', 'communication', 'message-square', 170, 0, '', false),

-- INTEGRATIONS
('api_access', 'API Access', 'Programmatic access to data', 'integrations', 'code', 180, 0, '', false),
('webhook_integrations', 'Webhook Integrations', 'Send data to other apps', 'integrations', 'plug', 190, 0, '', false),
('zapier', 'Zapier Integration', 'Connect with 5000+ apps', 'integrations', 'zap', 200, 0, '', false),
('custom_integrations', 'Custom Integrations', 'Build custom connections', 'integrations', 'tool', 210, 0, '', false),

-- ADVANCED FEATURES
('custom_domains', 'Custom Domains', 'Use your own domain', 'advanced', 'globe', 220, 0, '', false),
('ssl_certificates', 'SSL Certificates', 'Free SSL for custom domains', 'advanced', 'lock', 230, 0, '', false),
('team_members', 'Team Members', 'Add users to your account', 'advanced', 'users', 240, 0, 'team members', false),
('roles_permissions', 'Roles & Permissions', 'Control team access', 'advanced', 'shield', 250, 0, '', false),
('white_label', 'White Label', 'Remove all FunnelSwift branding', 'advanced', 'eye-off', 260, 0, '', false),

-- REPORTING & ANALYTICS
('basic_analytics', 'Basic Analytics', 'View lead statistics', 'reporting', 'bar-chart-2', 270, -1, '', true),
('advanced_reports', 'Advanced Reports', 'Detailed analytics & insights', 'reporting', 'pie-chart', 280, 0, '', false),
('export_data', 'Data Export', 'Export contacts & reports', 'reporting', 'download', 290, 0, '', false),
('custom_dashboards', 'Custom Dashboards', 'Build your own dashboards', 'reporting', 'layout-dashboard', 300, 0, '', false),

-- AFFILIATE PROGRAM
('affiliate_program', 'Affiliate Program', 'Refer others & earn commissions', 'affiliate', 'share-2', 310, 0, '', false),
('affiliate_dashboard', 'Affiliate Dashboard', 'Track referrals & earnings', 'affiliate', 'trending-up', 320, 0, '', false),
('affiliate_custom_rates', 'Custom Commission Rates', 'Negotiated commission rates', 'affiliate', 'percent', 330, 0, '', false),
('affiliate_sub_affiliates', 'Sub-Affiliates', 'Build affiliate network', 'affiliate', 'git-merge', 340, 0, '', false),

-- SUPPORT
('email_support', 'Email Support', 'Support via email', 'support', 'mail', 350, -1, '', true),
('priority_support', 'Priority Support', 'Faster response times', 'support', 'zap', 360, 0, '', false),
('dedicated_support', 'Dedicated Support', 'Dedicated account manager', 'support', 'user', 370, 0, '', false),
('phone_support', 'Phone Support', 'Call for help', 'support', 'phone', 380, 0, '', false)

ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================
-- 2. PLAN FEATURES TABLE
-- Which features are enabled for each plan + custom limits
-- ============================================

CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES funnelswift_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES feature_definitions(key),
  
  -- Is this feature enabled?
  is_enabled BOOLEAN DEFAULT false,
  
  -- Custom limit for this plan (-1 = unlimited, 0 = disabled, >0 = limit)
  custom_limit INTEGER,
  
  -- Display override (optional)
  display_name_override TEXT,
  display_description_override TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(plan_id, feature_key)
);

-- Function to auto-populate plan features when plan is created
CREATE OR REPLACE FUNCTION populate_plan_features()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO plan_features (plan_id, feature_key, is_enabled, custom_limit)
  SELECT 
    NEW.id,
    fd.key,
    CASE 
      WHEN fd.is_core THEN true
      WHEN NEW.slug = 'free' AND fd.category = 'core' THEN true
      WHEN NEW.slug = 'starter' AND fd.category IN ('core', 'capture') THEN true
      WHEN NEW.slug = 'pro' AND fd.category IN ('core', 'capture', 'automation', 'communication') THEN true
      WHEN NEW.slug = 'enterprise' THEN true
      ELSE false
    END,
    CASE 
      WHEN fd.key = 'contacts' THEN
        CASE NEW.slug
          WHEN 'free' THEN 100
          WHEN 'starter' THEN 1000
          WHEN 'pro' THEN -1
          WHEN 'enterprise' THEN -1
        END
      WHEN fd.key = 'lead_forms' THEN
        CASE NEW.slug
          WHEN 'free' THEN 1
          WHEN 'starter' THEN 5
          WHEN 'pro' THEN -1
          WHEN 'enterprise' THEN -1
        END
      WHEN fd.key = 'workflows' THEN
        CASE NEW.slug
          WHEN 'free' THEN 0
          WHEN 'starter' THEN 3
          WHEN 'pro' THEN 10
          WHEN 'enterprise' THEN -1
        END
      WHEN fd.key = 'team_members' THEN
        CASE NEW.slug
          WHEN 'free' THEN 1
          WHEN 'starter' THEN 1
          WHEN 'pro' THEN 3
          WHEN 'enterprise' THEN -1
        END
      ELSE fd.default_limit
    END
  FROM feature_definitions fd;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate features
DROP TRIGGER IF EXISTS auto_populate_plan_features ON funnelswift_plans;
CREATE TRIGGER auto_populate_plan_features
  AFTER INSERT ON funnelswift_plans
  FOR EACH ROW EXECUTE FUNCTION populate_plan_features();

-- Populate features for existing plans
INSERT INTO plan_features (plan_id, feature_key, is_enabled, custom_limit)
SELECT 
  fp.id,
  fd.key,
  CASE 
    WHEN fd.is_core THEN true
    WHEN fp.slug = 'free' AND fd.category = 'core' THEN true
    WHEN fp.slug = 'starter' AND fd.category IN ('core', 'capture') THEN true
    WHEN fp.slug = 'pro' AND fd.category IN ('core', 'capture', 'automation', 'communication') THEN true
    WHEN fp.slug = 'enterprise' THEN true
    ELSE false
  END,
  CASE 
    WHEN fd.key = 'contacts' THEN
      CASE fp.slug
        WHEN 'free' THEN 100
        WHEN 'starter' THEN 1000
        WHEN 'pro' THEN -1
        WHEN 'enterprise' THEN -1
      END
    WHEN fd.key = 'lead_forms' THEN
      CASE fp.slug
        WHEN 'free' THEN 1
        WHEN 'starter' THEN 5
        WHEN 'pro' THEN -1
        WHEN 'enterprise' THEN -1
      END
    WHEN fd.key = 'workflows' THEN
      CASE fp.slug
        WHEN 'free' THEN 0
        WHEN 'starter' THEN 3
        WHEN 'pro' THEN 10
        WHEN 'enterprise' THEN -1
      END
    WHEN fd.key = 'team_members' THEN
      CASE fp.slug
        WHEN 'free' THEN 1
        WHEN 'starter' THEN 1
        WHEN 'pro' THEN 3
        WHEN 'enterprise' THEN -1
      END
    ELSE fd.default_limit
  END
FROM funnelswift_plans fp
CROSS JOIN feature_definitions fd
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ============================================
-- 3. DYNAMIC PRICING TABLE
-- Edit pricing for each plan with history tracking
-- ============================================

CREATE TABLE IF NOT EXISTS plan_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES funnelswift_plans(id),
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  
  -- Commission rates at this price point
  commission_rate DECIMAL(5,2) NOT NULL,
  cross_system_commission_rate DECIMAL(5,2) NOT NULL,
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  
  effective_from TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to log pricing changes
CREATE OR REPLACE FUNCTION log_plan_pricing_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_monthly != NEW.price_monthly OR 
     OLD.price_yearly != NEW.price_yearly OR
     OLD.default_commission_rate != NEW.default_commission_rate THEN
    
    INSERT INTO plan_pricing_history (
      plan_id,
      price_monthly,
      price_yearly,
      commission_rate,
      cross_system_commission_rate
    ) VALUES (
      NEW.id,
      NEW.price_monthly,
      NEW.price_yearly,
      NEW.default_commission_rate,
      NEW.cross_system_commission_rate
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log pricing changes
DROP TRIGGER IF EXISTS log_pricing_changes ON funnelswift_plans;
CREATE TRIGGER log_pricing_changes
  AFTER UPDATE ON funnelswift_plans
  FOR EACH ROW EXECUTE FUNCTION log_plan_pricing_change();

-- ============================================
-- 4. VIEWS FOR ADMIN UI
-- ============================================

-- View: All plans with their features
CREATE OR REPLACE VIEW plans_with_features AS
SELECT 
  fp.*,
  jsonb_agg(
    jsonb_build_object(
      'key', fd.key,
      'name', fd.name,
      'description', fd.description,
      'category', fd.category,
      'icon', fd.icon,
      'is_enabled', pf.is_enabled,
      'limit', COALESCE(pf.custom_limit, fd.default_limit),
      'unit_label', fd.unit_label,
      'is_core', fd.is_core
    ) ORDER BY fd.sort_order
  ) FILTER (WHERE fd.key IS NOT NULL) as features
FROM funnelswift_plans fp
LEFT JOIN plan_features pf ON pf.plan_id = fp.id
LEFT JOIN feature_definitions fd ON fd.key = pf.feature_key
GROUP BY fp.id;

-- View: Feature comparison matrix
CREATE OR REPLACE VIEW feature_comparison_matrix AS
SELECT 
  fd.key as feature_key,
  fd.name as feature_name,
  fd.category,
  fd.description,
  jsonb_object_agg(
    fp.slug,
    jsonb_build_object(
      'is_enabled', pf.is_enabled,
      'limit', COALESCE(pf.custom_limit, fd.default_limit),
      'unit', fd.unit_label
    )
  ) as plan_comparison
FROM feature_definitions fd
CROSS JOIN funnelswift_plans fp
LEFT JOIN plan_features pf ON pf.plan_id = fp.id AND pf.feature_key = fd.key
WHERE fp.is_active = true
GROUP BY fd.key, fd.name, fd.category, fd.description, fd.sort_order
ORDER BY fd.sort_order;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pricing_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view feature definitions
CREATE POLICY "Anyone can view features"
  ON feature_definitions FOR SELECT USING (true);

-- Super admin can manage features
CREATE POLICY "Super admin can manage features"
  ON feature_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Anyone can view plan features
CREATE POLICY "Anyone can view plan features"
  ON plan_features FOR SELECT USING (true);

-- Super admin can manage plan features
CREATE POLICY "Super admin can manage plan features"
  ON plan_features FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Super admin can view pricing history
CREATE POLICY "Super admin can view pricing history"
  ON plan_pricing_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

SELECT 'Dynamic features and pricing system created!' as status;
