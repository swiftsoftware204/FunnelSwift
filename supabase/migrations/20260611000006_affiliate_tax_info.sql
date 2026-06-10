-- Affiliate Tax Information (W-9 Storage)
-- Required for 1099-NEC generation at year-end

CREATE TABLE affiliate_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- W-9 Information
  legal_name TEXT NOT NULL,
  business_name TEXT,
  entity_type TEXT NOT NULL, -- 'individual', 'llc', 'corporation', 'partnership'
  tax_id_type TEXT NOT NULL, -- 'ssn', 'ein'
  tax_id TEXT NOT NULL, -- Encrypted SSN or EIN
  
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  
  -- Signature
  signature TEXT NOT NULL,
  date_signed TIMESTAMPTZ NOT NULL,
  
  -- Status
  w9_status TEXT DEFAULT 'submitted', -- 'submitted', 'verified', 'rejected'
  
  -- 1099 Generation tracking
  tax_year_2026_issued BOOLEAN DEFAULT false,
  tax_year_2026_1099_id TEXT,
  
  -- Encryption
  encryption_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliate_tax_info_affiliate ON affiliate_tax_info(affiliate_id);
CREATE INDEX idx_affiliate_tax_info_user ON affiliate_tax_info(user_id);
CREATE INDEX idx_affiliate_tax_info_status ON affiliate_tax_info(w9_status);

-- Enable RLS
ALTER TABLE affiliate_tax_info ENABLE ROW LEVEL SECURITY;

-- Users can view their own tax info
CREATE POLICY "Users can view own tax info"
  ON affiliate_tax_info FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own tax info
CREATE POLICY "Users can update own tax info"
  ON affiliate_tax_info FOR ALL
  USING (user_id = auth.uid());

-- Super admin can view all (for 1099 generation)
CREATE POLICY "Super admin can view all tax info"
  ON affiliate_tax_info FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================
-- 1099-NEC Tracking Table
-- ============================================
CREATE TABLE tax_forms_1099 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year INTEGER NOT NULL,
  
  -- Affiliate info
  affiliate_id UUID REFERENCES affiliate_profiles(id),
  affiliate_tax_info_id UUID REFERENCES affiliate_tax_info(id),
  
  -- 1099 Data
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_tin TEXT NOT NULL, -- Last 4 only for security
  
  -- Payment info
  total_payments DECIMAL(10,2) NOT NULL,
  federal_tax_withheld DECIMAL(10,2) DEFAULT 0,
  
  -- Form status
  status TEXT DEFAULT 'draft', -- 'draft', 'issued', 'filed', 'delivered'
  issued_at TIMESTAMPTZ,
  filed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- IRS filing info
  irs_copy_a_sent BOOLEAN DEFAULT false,
  recipient_copy_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique: one 1099 per affiliate per year
CREATE UNIQUE INDEX idx_tax_forms_1099_unique ON tax_forms_1099(tax_year, affiliate_id);

CREATE INDEX idx_tax_forms_1099_year ON tax_forms_1099(tax_year);
CREATE INDEX idx_tax_forms_1099_status ON tax_forms_1099(status);

-- Enable RLS
ALTER TABLE tax_forms_1099 ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own 1099s
CREATE POLICY "Affiliates can view own 1099s"
  ON tax_forms_1099 FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM affiliate_profiles 
    WHERE id = tax_forms_1099.affiliate_id 
    AND user_id = auth.uid()
  ));

-- Super admin can manage all 1099s
CREATE POLICY "Super admin can manage all 1099s"
  ON tax_forms_1099 FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================
-- Function to generate 1099s at year-end
-- ============================================
CREATE OR REPLACE FUNCTION generate_1099s_for_year(target_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
  affiliate_record RECORD;
  total_commissions DECIMAL(10,2);
  forms_generated INTEGER := 0;
BEGIN
  -- Loop through all affiliates with tax info
  FOR affiliate_record IN 
    SELECT 
      ap.id as affiliate_id,
      ap.user_id,
      ati.id as tax_info_id,
      ati.legal_name,
      ati.address,
      ati.city,
      ati.state,
      ati.zip,
      ati.tax_id,
      COALESCE(SUM(ac.commission_amount), 0) as total_paid
    FROM affiliate_profiles ap
    JOIN affiliate_tax_info ati ON ati.affiliate_id = ap.id
    LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = ap.id 
      AND EXTRACT(YEAR FROM ac.created_at) = target_year
      AND ac.status = 'paid'
    WHERE ati.w9_status = 'submitted'
    GROUP BY ap.id, ap.user_id, ati.id, ati.legal_name, ati.address, ati.city, ati.state, ati.zip, ati.tax_id
    HAVING COALESCE(SUM(ac.commission_amount), 0) >= 600 -- Only if $600+ threshold
  LOOP
    -- Generate 1099
    INSERT INTO tax_forms_1099 (
      tax_year,
      affiliate_id,
      affiliate_tax_info_id,
      recipient_name,
      recipient_address,
      recipient_tin,
      total_payments,
      status
    ) VALUES (
      target_year,
      affiliate_record.affiliate_id,
      affiliate_record.tax_info_id,
      affiliate_record.legal_name,
      affiliate_record.address || ', ' || affiliate_record.city || ', ' || affiliate_record.state || ' ' || affiliate_record.zip,
      'XXX-XX-' || RIGHT(affiliate_record.tax_id, 4), -- Mask all but last 4
      affiliate_record.total_paid,
      'draft'
    )
    ON CONFLICT (tax_year, affiliate_id) 
    DO UPDATE SET
      total_payments = EXCLUDED.total_payments,
      updated_at = now();
    
    forms_generated := forms_generated + 1;
  END LOOP;
  
  RETURN forms_generated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Super Admin Tax Dashboard View
-- ============================================
CREATE VIEW super_admin_tax_dashboard AS
SELECT
  tf.tax_year,
  COUNT(*) as total_1099s,
  SUM(tf.total_payments) as total_payments,
  COUNT(*) FILTER (WHERE tf.status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE tf.status = 'issued') as issued_count,
  COUNT(*) FILTER (WHERE tf.status = 'filed') as filed_count
FROM tax_forms_1099 tf
GROUP BY tf.tax_year
ORDER BY tf.tax_year DESC;
