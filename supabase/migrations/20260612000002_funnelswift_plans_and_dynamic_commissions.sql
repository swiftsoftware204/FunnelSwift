-- ============================================
-- FUNNELSWIFT PLANS + DYNAMIC COMMISSION RATES
-- 4 Plans with editable commission rates per affiliate per plan
-- ============================================

-- ============================================
-- 1. FUNNELSWIFT PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS funnelswift_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan identification
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  
  -- Features (JSON for flexibility)
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}', -- { "contacts": 100, "forms": 5, etc. }
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Default commission rates (can be overridden per affiliate)
  default_commission_rate DECIMAL(5,2) DEFAULT 30.00,
  default_commission_type TEXT DEFAULT 'percentage', -- 'percentage' or 'flat'
  default_commission_amount DECIMAL(10,2) DEFAULT 0, -- for flat rate
  
  -- Cross-system commission rates (for leads tagged with system tags)
  cross_system_commission_rate DECIMAL(5,2) DEFAULT 30.00,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert 4 FunnelSwift plans
INSERT INTO funnelswift_plans (
  name, 
  slug, 
  description, 
  price_monthly, 
  price_yearly, 
  is_free,
  features,
  limits,
  display_order,
  is_popular,
  default_commission_rate,
  cross_system_commission_rate
) VALUES 
(
  'Free',
  'free',
  'Get started with basic lead capture',
  0,
  0,
  true,
  '[
    "Up to 100 contacts",
    "1 lead form",
    "Basic tagging",
    "Email notifications"
  ]'::jsonb,
  '{"contacts": 100, "forms": 1, "workflows": 0}'::jsonb,
  1,
  false,
  10.00,  -- 10% commission on free plan upgrades
  10.00
),
(
  'Starter',
  'starter',
  'Perfect for solo entrepreneurs',
  29.00,
  290.00,
  false,
  '[
    "Up to 1,000 contacts",
    "5 lead forms",
    "Advanced tagging",
    "Basic automations",
    "Affiliate program access"
  ]'::jsonb,
  '{"contacts": 1000, "forms": 5, "workflows": 3}'::jsonb,
  2,
  false,
  30.00,  -- 30% commission
  30.00
),
(
  'Pro',
  'pro',
  'For growing businesses',
  79.00,
  790.00,
  false,
  '[
    "Unlimited contacts",
    "Unlimited lead forms",
    "Advanced automations",
    "Priority support",
    "Custom domains",
    "Affiliate program access",
    "Team members (3)"
  ]'::jsonb,
  '{"contacts": -1, "forms": -1, "workflows": 10, "team_members": 3}'::jsonb,
  3,
  true,
  30.00,  -- 30% commission
  30.00
),
(
  'Enterprise',
  'enterprise',
  'For agencies and large teams',
  199.00,
  1990.00,
  false,
  '[
    "Everything in Pro",
    "Unlimited team members",
    "White-label options",
    "API access",
    "Dedicated support",
    "Custom integrations",
    "Affiliate program access"
  ]'::jsonb,
  '{"contacts": -1, "forms": -1, "workflows": -1, "team_members": -1}'::jsonb,
  4,
  false,
  30.00,  -- 30% commission
  30.00
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = now();

-- ============================================
-- 2. AFFILIATE PLAN COMMISSIONS TABLE
-- Custom commission rates per affiliate per plan
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_plan_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES funnelswift_plans(id) ON DELETE CASCADE,
  
  -- Custom commission settings (NULL = use plan defaults)
  custom_commission_rate DECIMAL(5,2), -- e.g., 40.00 for 40%
  custom_commission_type TEXT, -- 'percentage' or 'flat'
  custom_commission_amount DECIMAL(10,2), -- for flat rate
  
  -- Override cross-system commissions too
  custom_cross_system_rate DECIMAL(5,2),
  
  -- Metadata
  notes TEXT, -- "VIP affiliate", "Promotional rate", etc.
  effective_from TIMESTAMPTZ DEFAULT now(),
  effective_until TIMESTAMPTZ, -- NULL = no expiration
  
  created_by UUID REFERENCES auth.users(id), -- Admin who set this
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(affiliate_id, plan_id)
);

-- Enable RLS
ALTER TABLE funnelswift_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_plan_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for funnelswift_plans
CREATE POLICY "Anyone can view active plans"
  ON funnelswift_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin can manage plans"
  ON funnelswift_plans
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true
  ));

-- Policies for affiliate_plan_commissions
CREATE POLICY "Affiliates can view own commission rates"
  ON affiliate_plan_commissions
  FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Super admin can manage all commission rates"
  ON affiliate_plan_commissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true
  ));

-- ============================================
-- 3. FUNCTION: Get Commission Rate for Affiliate + Plan
-- ============================================

CREATE OR REPLACE FUNCTION get_affiliate_commission_rate(
  p_affiliate_id UUID,
  p_plan_id UUID,
  p_is_cross_system BOOLEAN DEFAULT false
)
RETURNS TABLE (
  commission_rate DECIMAL(5,2),
  commission_type TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  v_custom RECORD;
  v_plan RECORD;
BEGIN
  -- First check for custom commission rate
  SELECT * INTO v_custom
  FROM affiliate_plan_commissions
  WHERE affiliate_id = p_affiliate_id
  AND plan_id = p_plan_id
  AND (effective_until IS NULL OR effective_until > now())
  AND effective_from <= now();
  
  IF FOUND THEN
    -- Use custom rate
    IF p_is_cross_system AND v_custom.custom_cross_system_rate IS NOT NULL THEN
      RETURN QUERY SELECT 
        v_custom.custom_cross_system_rate,
        COALESCE(v_custom.custom_commission_type, 'percentage'),
        COALESCE(v_custom.custom_commission_amount, 0);
    ELSE
      RETURN QUERY SELECT 
        COALESCE(v_custom.custom_commission_rate, 30.00),
        COALESCE(v_custom.custom_commission_type, 'percentage'),
        COALESCE(v_custom.custom_commission_amount, 0);
    END IF;
    RETURN;
  END IF;
  
  -- Fall back to plan defaults
  SELECT * INTO v_plan
  FROM funnelswift_plans
  WHERE id = p_plan_id;
  
  IF FOUND THEN
    IF p_is_cross_system THEN
      RETURN QUERY SELECT 
        v_plan.cross_system_commission_rate,
        'percentage'::TEXT,
        0::DECIMAL;
    ELSE
      RETURN QUERY SELECT 
        v_plan.default_commission_rate,
        v_plan.default_commission_type,
        v_plan.default_commission_amount;
    END IF;
    RETURN;
  END IF;
  
  -- Ultimate fallback
  RETURN QUERY SELECT 30.00::DECIMAL, 'percentage'::TEXT, 0::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Calculate Commission with Plan Rates
-- ============================================

CREATE OR REPLACE FUNCTION calculate_affiliate_commission_v2(
  p_affiliate_id UUID,
  p_plan_id UUID,
  p_transaction_amount DECIMAL,
  p_is_cross_system BOOLEAN DEFAULT false
)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL(5,2);
  v_type TEXT;
  v_amount DECIMAL(10,2);
  v_commission DECIMAL(10,2);
BEGIN
  -- Get commission settings
  SELECT * INTO v_rate, v_type, v_amount
  FROM get_affiliate_commission_rate(p_affiliate_id, p_plan_id, p_is_cross_system);
  
  -- Calculate commission
  IF v_type = 'flat' THEN
    v_commission := v_amount;
  ELSE
    v_commission := (p_transaction_amount * v_rate) / 100;
  END IF;
  
  RETURN v_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEW: Affiliate Commission Rates Summary
-- ============================================

CREATE OR REPLACE VIEW affiliate_commission_summary AS
SELECT
  ap.id as affiliate_id,
  ap.affiliate_code,
  ap.display_name as affiliate_name,
  fp.id as plan_id,
  fp.name as plan_name,
  fp.slug as plan_slug,
  fp.price_monthly,
  fp.is_free,
  
  -- Effective commission rate
  COALESCE(
    apc.custom_commission_rate,
    fp.default_commission_rate
  ) as commission_rate,
  
  COALESCE(
    apc.custom_commission_type,
    fp.default_commission_type
  ) as commission_type,
  
  -- Calculate monthly commission
  CASE 
    WHEN COALESCE(apc.custom_commission_type, fp.default_commission_type) = 'flat'
    THEN COALESCE(apc.custom_commission_amount, fp.default_commission_amount)
    ELSE (fp.price_monthly * COALESCE(apc.custom_commission_rate, fp.default_commission_rate)) / 100
  END as monthly_commission,
  
  -- Is custom rate?
  CASE WHEN apc.id IS NOT NULL THEN true ELSE false END as has_custom_rate,
  
  apc.notes as custom_rate_notes,
  apc.effective_from as custom_rate_from,
  apc.effective_until as custom_rate_until

FROM affiliate_profiles ap
CROSS JOIN funnelswift_plans fp
LEFT JOIN affiliate_plan_commissions apc 
  ON apc.affiliate_id = ap.id 
  AND apc.plan_id = fp.id
  AND (apc.effective_until IS NULL OR apc.effective_until > now())
  AND apc.effective_from <= now()
WHERE fp.is_active = true
ORDER BY ap.display_name, fp.display_order;

-- ============================================
-- 6. VIEW: Super Admin Commission Dashboard
-- ============================================

CREATE OR REPLACE VIEW super_admin_commission_dashboard AS
SELECT
  fp.name as plan_name,
  fp.slug as plan_slug,
  fp.price_monthly,
  fp.price_yearly,
  fp.default_commission_rate,
  fp.cross_system_commission_rate,
  
  -- Count affiliates with custom rates
  COUNT(apc.id) as affiliates_with_custom_rate,
  
  -- Average custom rate
  AVG(apc.custom_commission_rate) as avg_custom_rate,
  
  -- Min/max custom rates
  MIN(apc.custom_commission_rate) as min_custom_rate,
  MAX(apc.custom_commission_rate) as max_custom_rate

FROM funnelswift_plans fp
LEFT JOIN affiliate_plan_commissions apc 
  ON apc.plan_id = fp.id
  AND (apc.effective_until IS NULL OR apc.effective_until > now())
GROUP BY fp.id, fp.name, fp.slug, fp.price_monthly, fp.price_yearly, 
         fp.default_commission_rate, fp.cross_system_commission_rate
ORDER BY fp.display_order;

-- ============================================
-- 7. TRIGGER: Update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS funnelswift_plans_updated_at ON funnelswift_plans;
CREATE TRIGGER funnelswift_plans_updated_at
  BEFORE UPDATE ON funnelswift_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS affiliate_plan_commissions_updated_at ON affiliate_plan_commissions;
CREATE TRIGGER affiliate_plan_commissions_updated_at
  BEFORE UPDATE ON affiliate_plan_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. INSERT SAMPLE CUSTOM COMMISSION (for testing)
-- ============================================

-- Give first affiliate a custom 40% rate on Pro plan
INSERT INTO affiliate_plan_commissions (
  affiliate_id,
  plan_id,
  custom_commission_rate,
  custom_commission_type,
  notes
)
SELECT 
  ap.id,
  fp.id,
  40.00,
  'percentage',
  'VIP affiliate - promotional rate'
FROM affiliate_profiles ap
CROSS JOIN funnelswift_plans fp
WHERE fp.slug = 'pro'
AND ap.id = (SELECT id FROM affiliate_profiles LIMIT 1)
ON CONFLICT (affiliate_id, plan_id) DO NOTHING;

SELECT 'FunnelSwift plans and dynamic commission system created!' as status;
