-- Campaigns and Custom Domains System

-- ============================================
-- Campaigns Table
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Domain settings
  domain_type TEXT DEFAULT 'system', -- 'system' or 'custom'
  system_domain TEXT, -- 'go.funnelswift.com'
  custom_domain TEXT, -- 'go.tenantdomain.com' or NULL
  
  -- Full URL (auto-generated)
  full_url TEXT,
  
  -- Content type and ID
  content_type TEXT, -- 'questionnaire', 'form', 'landing_page'
  content_id UUID,
  
  -- Campaign tracking (UTM)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_views INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: slug per domain per tenant
CREATE UNIQUE INDEX idx_campaigns_slug_domain ON campaigns(slug, system_domain, custom_domain, tenant_id);
CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_domain ON campaigns(system_domain, custom_domain);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);

-- ============================================
-- Tenant Custom Domains Table
-- ============================================
CREATE TABLE tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  domain TEXT NOT NULL, -- 'go.tenantdomain.com'
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_record TEXT, -- CNAME value to add
  verification_status TEXT DEFAULT 'pending', -- pending, verified, failed
  
  -- SSL
  ssl_status TEXT DEFAULT 'pending', -- pending, active, error
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique domain per tenant
CREATE UNIQUE INDEX idx_tenant_domains_domain ON tenant_domains(domain, tenant_id);
CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_verified ON tenant_domains(is_verified);

-- ============================================
-- System Domains Table (managed by Super Admin)
-- ============================================
CREATE TABLE system_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  domain TEXT UNIQUE NOT NULL, -- 'go.funnelswift.com'
  display_name TEXT NOT NULL, -- 'Go Links'
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default for new campaigns
  
  -- Stats
  total_campaigns INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default system domains
INSERT INTO system_domains (domain, display_name, description, is_default) VALUES
('go.funnelswift.com', 'Go Links', 'Short, professional links for campaigns', true),
('promo.funnelswift.com', 'Promotions', 'Perfect for sales and promotions', false),
('offers.funnelswift.com', 'Special Offers', 'For limited-time offers and deals', false);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_domains ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own campaigns
CREATE POLICY "Tenants can manage own campaigns"
  ON campaigns FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Tenants can manage their own domains
CREATE POLICY "Tenants can manage own domains"
  ON tenant_domains FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Everyone can view active system domains
CREATE POLICY "Everyone can view system domains"
  ON system_domains FOR SELECT
  USING (is_active = true);

-- Super admin can manage system domains
CREATE POLICY "Super admin can manage system domains"
  ON system_domains FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Super admin can view all campaigns
CREATE POLICY "Super admin can view all campaigns"
  ON campaigns FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================
-- Function to generate full_url
-- ============================================
CREATE OR REPLACE FUNCTION generate_campaign_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.domain_type = 'system' AND NEW.system_domain IS NOT NULL THEN
    NEW.full_url := NEW.system_domain || '/' || NEW.slug;
  ELSIF NEW.domain_type = 'custom' AND NEW.custom_domain IS NOT NULL THEN
    NEW.full_url := NEW.custom_domain || '/' || NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_generate_url
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION generate_campaign_url();

-- ============================================
-- Function to update timestamps
-- ============================================
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tenant_domains_updated_at
  BEFORE UPDATE ON tenant_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
