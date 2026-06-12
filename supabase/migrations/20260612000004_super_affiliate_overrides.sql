-- ============================================
-- SUPER AFFILIATE SYSTEM
-- Special tier with independent commission overrides
-- ============================================

-- ============================================
-- 1. ADD SUPER AFFILIATE FIELDS TO AFFILIATE PROFILES
-- ============================================

-- Add super affiliate fields if they don't exist
DO $$
BEGIN
  -- Check if columns exist before adding
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'is_super_affiliate') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN is_super_affiliate BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'super_affiliate_since') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN super_affiliate_since TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'super_affiliate_tier') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN super_affiliate_tier TEXT DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'global_commission_override') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN global_commission_override DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'override_reason') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN override_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'affiliate_profiles' AND column_name = 'special_perks') THEN
    ALTER TABLE affiliate_profiles ADD COLUMN special_perks JSONB DEFAULT '[]';
  END IF;
END $$;

-- ============================================
-- 2. SUPER AFFILIATE OVERRIDE TABLE
-- Detailed overrides per software/product
-- ============================================

CREATE TABLE IF NOT EXISTS super_affiliate_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  
  -- Override scope
  override_type TEXT NOT NULL DEFAULT 'global', -- 'global', 'software', 'product', 'plan'
  target_software TEXT, -- 'funnelswift', 'adaswift', 'missedcall', 'workflowswift' (NULL = all)
  target_product_id TEXT, -- Specific product ID (NULL = all products in software)
  target_plan_id UUID REFERENCES funnelswift_plans(id), -- Specific plan (NULL = all plans)
  
  -- Commission override (NULL = use default)
  commission_rate DECIMAL(5,2),
  commission_type TEXT DEFAULT 'percentage', -- 'percentage', 'flat', 'hybrid'
  flat_amount DECIMAL(10,2), -- For flat or hybrid
  
  -- Special bonuses
  signup_bonus DECIMAL(10,2) DEFAULT 0, -- One-time bonus per signup
  recurring_bonus_multiplier DECIMAL(3,2) DEFAULT 1.00, -- 1.5 = 50% extra on recurring
  
  -- Minimum guarantees
  minimum_payout DECIMAL(10,2), -- Guaranteed minimum per month
  
  -- Metadata
  notes TEXT,
  effective_from TIMESTAMPTZ DEFAULT now(),
  effective_until TIMESTAMPTZ, -- NULL = no expiration
  
  -- Who created this override
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Only one active override per scope
  UNIQUE(affiliate_id, override_type, target_software, target_product_id, target_plan_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_super_affiliate_overrides_affiliate ON super_affiliate_overrides(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_super_affiliate_overrides_type ON super_affiliate_overrides(override_type);
CREATE INDEX IF NOT EXISTS idx_super_affiliate_overrides_software ON super_affiliate_overrides(target_software);
CREATE INDEX IF NOT EXISTS idx_super_affiliate_overrides_active ON super_affiliate_overrides(effective_until) WHERE effective_until IS NULL OR effective_until > now();

-- Enable RLS
ALTER TABLE super_affiliate_overrides ENABLE ROW LEVEL SECURITY;

-- Super admin can manage all overrides
CREATE POLICY "Super admin can manage super affiliate overrides"
  ON super_affiliate_overrides FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Affiliates can view own overrides
CREATE POLICY "Affiliates can view own overrides"
  ON super_affiliate_overrides FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
  ));

-- ============================================
-- 3. FUNCTION: Get Commission with Super Affiliate Override
-- ============================================

CREATE OR REPLACE FUNCTION get_affiliate_commission_rate_v3(
  p_affiliate_id UUID,
  p_plan_id UUID DEFAULT NULL,
  p_software TEXT DEFAULT 'funnelswift',
  p_product_id TEXT DEFAULT NULL,
  p_is_cross_system BOOLEAN DEFAULT false
)
RETURNS TABLE (
  commission_rate DECIMAL(5,2),
  commission_type TEXT,
  flat_amount DECIMAL(10,2),
  is_super_affiliate_rate BOOLEAN,
  override_notes TEXT
) AS $$
DECLARE
  v_affiliate RECORD;
  v_override RECORD;
  v_plan_rate DECIMAL(5,2);
BEGIN
  -- Get affiliate info
  SELECT * INTO v_affiliate
  FROM affiliate_profiles
  WHERE id = p_affiliate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 30.00::DECIMAL, 'percentage'::TEXT, 0::DECIMAL, false::BOOLEAN, ''::TEXT;
    RETURN;
  END IF;
  
  -- Check for super affiliate global override first
  IF v_affiliate.is_super_affiliate AND v_affiliate.global_commission_override IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_affiliate.global_commission_override,
      'percentage'::TEXT,
      0::DECIMAL,
      true::BOOLEAN,
      COALESCE(v_affiliate.override_reason, 'Super Affiliate Global Rate')::TEXT;
    RETURN;
  END IF;
  
  -- Check for specific super affiliate overrides (most specific first)
  -- 1. Product-specific override
  SELECT * INTO v_override
  FROM super_affiliate_overrides
  WHERE affiliate_id = p_affiliate_id
  AND override_type = 'product'
  AND target_software = p_software
  AND target_product_id = p_product_id
  AND (effective_until IS NULL OR effective_until > now())
  AND effective_from <= now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 2. Software-specific override
  IF NOT FOUND THEN
    SELECT * INTO v_override
    FROM super_affiliate_overrides
    WHERE affiliate_id = p_affiliate_id
    AND override_type = 'software'
    AND target_software = p_software
    AND (effective_until IS NULL OR effective_until > now())
    AND effective_from <= now()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- 3. Plan-specific override
  IF NOT FOUND AND p_plan_id IS NOT NULL THEN
    SELECT * INTO v_override
    FROM super_affiliate_overrides
    WHERE affiliate_id = p_affiliate_id
    AND override_type = 'plan'
    AND target_plan_id = p_plan_id
    AND (effective_until IS NULL OR effective_until > now())
    AND effective_from <= now()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- 4. Global override
  IF NOT FOUND THEN
    SELECT * INTO v_override
    FROM super_affiliate_overrides
    WHERE affiliate_id = p_affiliate_id
    AND override_type = 'global'
    AND (effective_until IS NULL OR effective_until > now())
    AND effective_from <= now()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- If super affiliate override found, use it
  IF FOUND THEN
    RETURN QUERY SELECT 
      COALESCE(v_override.commission_rate, 30.00),
      COALESCE(v_override.commission_type, 'percentage'),
      COALESCE(v_override.flat_amount, 0),
      true::BOOLEAN,
      COALESCE(v_override.notes, 'Super Affiliate Override')::TEXT;
    RETURN;
  END IF;
  
  -- Fall back to standard affiliate plan commissions
  SELECT * INTO v_override
  FROM get_affiliate_commission_rate(p_affiliate_id, p_plan_id, p_is_cross_system);
  
  RETURN QUERY SELECT 
    v_override.commission_rate,
    v_override.commission_type,
    v_override.commission_amount,
    false::BOOLEAN,
    ''::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Toggle Super Affiliate Status
-- ============================================

CREATE OR REPLACE FUNCTION toggle_super_affiliate(
  p_affiliate_id UUID,
  p_make_super BOOLEAN,
  p_global_rate DECIMAL(5,2) DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE affiliate_profiles
  SET 
    is_super_affiliate = p_make_super,
    super_affiliate_since = CASE WHEN p_make_super THEN now() ELSE NULL END,
    global_commission_override = CASE WHEN p_make_super THEN p_global_rate ELSE NULL END,
    override_reason = CASE WHEN p_make_super THEN p_reason ELSE NULL END,
    updated_at = now()
  WHERE id = p_affiliate_id;
  
  -- If making super affiliate with specific overrides, log it
  IF p_make_super AND p_global_rate IS NOT NULL THEN
    INSERT INTO super_affiliate_overrides (
      affiliate_id,
      override_type,
      commission_rate,
      commission_type,
      notes,
      created_by
    ) VALUES (
      p_affiliate_id,
      'global',
      p_global_rate,
      'percentage',
      COALESCE(p_reason, 'Super Affiliate Global Rate'),
      p_admin_user_id
    )
    ON CONFLICT (affiliate_id, override_type, target_software, target_product_id, target_plan_id)
    DO UPDATE SET
      commission_rate = EXCLUDED.commission_rate,
      notes = EXCLUDED.notes,
      updated_at = now();
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEW: Super Affiliate Dashboard
-- ============================================

CREATE OR REPLACE VIEW super_affiliate_dashboard AS
SELECT
  ap.id as affiliate_id,
  ap.affiliate_code,
  ap.display_name as affiliate_name,
  ap.email,
  ap.is_super_affiliate,
  ap.super_affiliate_since,
  ap.super_affiliate_tier,
  ap.global_commission_override as global_rate,
  ap.override_reason,
  
  -- Stats
  ap.total_referrals,
  ap.total_conversions,
  ap.total_commissions,
  
  -- Override count
  (SELECT COUNT(*) FROM super_affiliate_overrides sao WHERE sao.affiliate_id = ap.id) as override_count,
  
  -- Special perks
  ap.special_perks

FROM affiliate_profiles ap
WHERE ap.is_super_affiliate = true OR ap.global_commission_override IS NOT NULL
ORDER BY ap.super_affiliate_since DESC NULLS LAST;

-- ============================================
-- 6. VIEW: Admin Affiliate Management
-- ============================================

CREATE OR REPLACE VIEW admin_affiliate_management AS
SELECT
  ap.id as affiliate_id,
  ap.affiliate_code,
  ap.display_name as affiliate_name,
  ap.email,
  ap.status,
  
  -- Super affiliate status
  ap.is_super_affiliate,
  ap.super_affiliate_since,
  ap.global_commission_override as super_rate,
  
  -- Quick toggle info
  CASE 
    WHEN ap.is_super_affiliate THEN '⭐ SUPER'
    ELSE 'Standard'
  END as affiliate_tier,
  
  -- Current effective rate
  COALESCE(
    ap.global_commission_override,
    (SELECT default_commission_rate FROM funnelswift_plans WHERE slug = 'pro' LIMIT 1),
    30.00
  ) as effective_commission_rate,
  
  -- Performance
  ap.total_referrals,
  ap.total_conversions,
  ap.total_commissions,
  ap.pending_commissions,
  
  -- Last activity
  ap.updated_at as last_activity

FROM affiliate_profiles ap
ORDER BY 
  ap.is_super_affiliate DESC,
  ap.total_commissions DESC;

-- ============================================
-- 7. SAMPLE SUPER AFFILIATE (for testing)
-- ============================================

-- Make first affiliate a super affiliate at 50% commission
UPDATE affiliate_profiles
SET 
  is_super_affiliate = true,
  super_affiliate_since = now(),
  super_affiliate_tier = 'platinum',
  global_commission_override = 50.00,
  override_reason = 'Top performer - special partnership rate',
  special_perks = '[
    "Early access to new products",
    "Direct line to support team",
    "Co-marketing opportunities",
    "Custom landing pages"
  ]'::jsonb
WHERE id = (SELECT id FROM affiliate_profiles ORDER BY created_at LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE is_super_affiliate = true);

SELECT 'Super Affiliate system created!' as status;
