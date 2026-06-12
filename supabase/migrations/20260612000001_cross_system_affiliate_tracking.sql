-- ============================================
-- CROSS-SYSTEM AFFILIATE TRACKING
-- Enables affiliates to get credit for upgrades in ANY SwiftSoftware app
-- ============================================

-- ============================================
-- 1. TRACKING TOKENS TABLE
-- Links leads across all systems with affiliate attribution
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_tracking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core tracking
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id),
  
  -- Original lead info (from FunnelSwift)
  original_contact_id UUID REFERENCES contacts(id),
  original_email TEXT NOT NULL,
  original_phone TEXT,
  
  -- Tracking metadata
  source_tag TEXT NOT NULL, -- e.g., 'ada-demo', 'missedcall-demo'
  target_software TEXT NOT NULL, -- e.g., 'adaswift', 'missedcall', 'workflowswift'
  
  -- Status
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'demo_created', 'upgraded', 'expired')),
  
  -- Cross-system IDs (populated when demo created in target software)
  target_contact_id TEXT, -- ID in target software
  target_account_id TEXT, -- Account/demo ID in target software
  
  -- Upgrade tracking
  upgraded_at TIMESTAMPTZ,
  upgrade_value DECIMAL(10,2),
  commission_calculated BOOLEAN DEFAULT false,
  commission_amount DECIMAL(10,2),
  
  -- Expiration (tokens expire after 90 days)
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_affiliate ON affiliate_tracking_tokens(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_token ON affiliate_tracking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_email ON affiliate_tracking_tokens(original_email);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_status ON affiliate_tracking_tokens(status);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_target ON affiliate_tracking_tokens(target_software, target_contact_id);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_expires ON affiliate_tracking_tokens(expires_at);

-- Enable RLS
ALTER TABLE affiliate_tracking_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own tracking tokens"
  ON affiliate_tracking_tokens
  FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage tracking tokens"
  ON affiliate_tracking_tokens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. CROSS-SYSTEM COMMISSIONS TABLE
-- Records commissions from ALL software products
-- ============================================

CREATE TABLE IF NOT EXISTS cross_system_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Affiliate
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id),
  tracking_token_id UUID REFERENCES affiliate_tracking_tokens(id),
  
  -- Source
  source_software TEXT NOT NULL, -- 'adaswift', 'missedcall', 'workflowswift', 'funnelswift'
  source_transaction_id TEXT NOT NULL,
  
  -- Customer
  customer_email TEXT NOT NULL,
  customer_id UUID REFERENCES contacts(id),
  
  -- Financial
  transaction_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Product details
  product_name TEXT,
  product_id TEXT,
  plan_slug TEXT,
  billing_cycle TEXT, -- 'monthly', 'yearly', 'one-time'
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'refunded', 'disputed')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_id TEXT,
  
  -- Metadata
  webhook_data JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cross_commissions_affiliate ON cross_system_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cross_commissions_status ON cross_system_commissions(status);
CREATE INDEX IF NOT EXISTS idx_cross_commissions_software ON cross_system_commissions(source_software);
CREATE INDEX IF NOT EXISTS idx_cross_commissions_transaction ON cross_system_commissions(source_software, source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cross_commissions_email ON cross_system_commissions(customer_email);
CREATE INDEX IF NOT EXISTS idx_cross_commissions_created ON cross_system_commissions(created_at);

-- Enable RLS
ALTER TABLE cross_system_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions"
  ON cross_system_commissions
  FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage commissions"
  ON cross_system_commissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. FUNCTION: Create Tracking Token
-- Called when affiliate-tagged lead is created in FunnelSwift
-- ============================================

CREATE OR REPLACE FUNCTION create_affiliate_tracking_token(
  p_affiliate_id UUID,
  p_contact_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_source_tag TEXT,
  p_target_software TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate unique token
  v_token := gen_random_uuid()::TEXT;
  
  INSERT INTO affiliate_tracking_tokens (
    token,
    affiliate_id,
    original_contact_id,
    original_email,
    original_phone,
    source_tag,
    target_software
  ) VALUES (
    v_token,
    p_affiliate_id,
    p_contact_id,
    p_email,
    p_phone,
    p_source_tag,
    p_target_software
  );
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Record Cross-System Upgrade
-- Called by webhook from satellite apps when upgrade happens
-- ============================================

CREATE OR REPLACE FUNCTION record_cross_system_upgrade(
  p_token TEXT,
  p_software TEXT,
  p_transaction_id TEXT,
  p_customer_email TEXT,
  p_amount DECIMAL,
  p_product_name TEXT,
  p_plan_slug TEXT,
  p_billing_cycle TEXT,
  p_webhook_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_tracking RECORD;
  v_affiliate RECORD;
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
  v_commission_id UUID;
BEGIN
  -- Get tracking token info
  SELECT * INTO v_tracking
  FROM affiliate_tracking_tokens
  WHERE token = p_token
  AND status IN ('created', 'demo_created')
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired tracking token';
  END IF;
  
  -- Get affiliate commission rate
  SELECT commission_rate INTO v_commission_rate
  FROM affiliate_profiles
  WHERE id = v_tracking.affiliate_id;
  
  IF v_commission_rate IS NULL THEN
    v_commission_rate := 30.00; -- Default 30%
  END IF;
  
  -- Calculate commission
  v_commission_amount := (p_amount * v_commission_rate) / 100;
  
  -- Create commission record
  INSERT INTO cross_system_commissions (
    affiliate_id,
    tracking_token_id,
    source_software,
    source_transaction_id,
    customer_email,
    transaction_amount,
    commission_rate,
    commission_amount,
    product_name,
    plan_slug,
    billing_cycle,
    webhook_data
  ) VALUES (
    v_tracking.affiliate_id,
    v_tracking.id,
    p_software,
    p_transaction_id,
    p_customer_email,
    p_amount,
    v_commission_rate,
    v_commission_amount,
    p_product_name,
    p_plan_slug,
    p_billing_cycle,
    p_webhook_data
  )
  RETURNING id INTO v_commission_id;
  
  -- Update tracking token
  UPDATE affiliate_tracking_tokens
  SET 
    status = 'upgraded',
    upgraded_at = now(),
    upgrade_value = p_amount,
    commission_calculated = true,
    commission_amount = v_commission_amount,
    updated_at = now()
  WHERE id = v_tracking.id;
  
  -- Update affiliate stats
  UPDATE affiliate_profiles
  SET 
    total_conversions = total_conversions + 1,
    total_commissions = total_commissions + v_commission_amount,
    pending_commissions = pending_commissions + v_commission_amount,
    updated_at = now()
  WHERE id = v_tracking.affiliate_id;
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEW: Affiliate Cross-System Dashboard
-- ============================================

CREATE OR REPLACE VIEW affiliate_cross_system_dashboard AS
SELECT
  att.affiliate_id,
  ap.affiliate_code,
  ap.display_name as affiliate_name,
  
  -- Overview stats
  COUNT(*) FILTER (WHERE att.status = 'created') as pending_demos,
  COUNT(*) FILTER (WHERE att.status = 'demo_created') as active_demos,
  COUNT(*) FILTER (WHERE att.status = 'upgraded') as total_conversions,
  
  -- Financial
  COALESCE(SUM(att.upgrade_value), 0) as total_revenue_generated,
  COALESCE(SUM(att.commission_amount), 0) as total_commissions_earned,
  
  -- By software
  COUNT(*) FILTER (WHERE att.target_software = 'adaswift' AND att.status = 'upgraded') as adaswift_conversions,
  COUNT(*) FILTER (WHERE att.target_software = 'missedcall' AND att.status = 'upgraded') as missedcall_conversions,
  COUNT(*) FILTER (WHERE att.target_software = 'workflowswift' AND att.status = 'upgraded') as workflowswift_conversions,
  
  -- Recent activity
  MAX(att.updated_at) as last_activity

FROM affiliate_tracking_tokens att
JOIN affiliate_profiles ap ON ap.id = att.affiliate_id
GROUP BY att.affiliate_id, ap.affiliate_code, ap.display_name;

-- ============================================
-- 6. VIEW: Super Admin Cross-System Report
-- ============================================

CREATE OR REPLACE VIEW super_admin_cross_system_report AS
SELECT
  csc.source_software,
  DATE_TRUNC('month', csc.created_at) as month,
  COUNT(*) as total_transactions,
  SUM(csc.transaction_amount) as total_revenue,
  SUM(csc.commission_amount) as total_commissions,
  AVG(csc.commission_rate) as avg_commission_rate,
  COUNT(*) FILTER (WHERE csc.status = 'pending') as pending_commissions,
  COUNT(*) FILTER (WHERE csc.status = 'paid') as paid_commissions

FROM cross_system_commissions csc
GROUP BY csc.source_software, DATE_TRUNC('month', csc.created_at)
ORDER BY month DESC, source_software;

-- ============================================
-- 7. TRIGGER: Auto-create tracking token on tagged lead
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_tracking_on_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_contact RECORD;
  v_affiliate_id UUID;
  v_system_tag RECORD;
  v_token TEXT;
BEGIN
  -- Get contact info
  SELECT * INTO v_contact
  FROM contacts
  WHERE id = NEW.contact_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Check if this is a system tag that should create tracking
  SELECT * INTO v_system_tag
  FROM system_tags
  WHERE id = NEW.system_tag_id
  AND is_hardcoded = true
  AND target_software IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Find affiliate from master lead tracking
  SELECT referred_by_user_id INTO v_affiliate_id
  FROM master_lead_tracking
  WHERE contact_id = NEW.contact_id
  AND referred_by_user_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create tracking token
  v_token := create_affiliate_tracking_token(
    v_affiliate_id,
    NEW.contact_id,
    v_contact.email,
    v_contact.phone,
    v_system_tag.tag_name,
    v_system_tag.target_software
  );
  
  -- Log the tracking creation
  INSERT INTO integration_events (
    event_type,
    source_app,
    target_app,
    payload
  ) VALUES (
    'tracking_token_created',
    'funnelswift',
    v_system_tag.target_software,
    jsonb_build_object(
      'token', v_token,
      'affiliate_id', v_affiliate_id,
      'contact_id', NEW.contact_id,
      'tag', v_system_tag.tag_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (commented out - enable after testing)
-- DROP TRIGGER IF EXISTS auto_tracking_on_system_tag ON contact_tags;
-- CREATE TRIGGER auto_tracking_on_system_tag
--   AFTER INSERT ON contact_tags
--   FOR EACH ROW
--   WHEN (NEW.system_tag_id IS NOT NULL)
--   EXECUTE FUNCTION auto_create_tracking_on_tag();

SELECT 'Cross-system affiliate tracking tables created!' as status;
