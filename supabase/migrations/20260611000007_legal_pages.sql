-- Legal Pages System
-- Editable Terms of Service, Privacy Policy, etc.

CREATE TABLE legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page identification
  slug TEXT UNIQUE NOT NULL, -- 'terms-of-service', 'privacy-policy', etc.
  title TEXT NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT GENERATED ALWAYS AS (
    -- Simple markdown to HTML conversion
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content, '# ', '<h1>'),
          '## ', '<h2>'
        ),
        '### ', '<h3>'
      ),
      '\n\n', '<br/><br/>'
    )
  ) STORED,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  -- Tracking
  last_updated TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default pages with templates
INSERT INTO legal_pages (slug, title, content, is_published) VALUES
('terms-of-service', 'Terms of Service', E'# Terms of Service\n\nLast Updated: ' || CURRENT_DATE || E'\n\n## 1. Acceptance of Terms\n\nBy accessing and using FunnelSwift, you agree to be bound by these Terms of Service.\n\n## 2. Description of Service\n\nFunnelSwift provides lead capture, CRM, and affiliate marketing tools.\n\n## 3. User Accounts\n\nYou must provide accurate information when creating an account.\n\n## 4. Payment Terms\n\n[Add your payment terms here]\n\n## 5. Affiliate Program\n\n[Add affiliate program terms here]\n\n## 6. Limitation of Liability\n\n[Add liability limitations here]\n\n## 7. Contact\n\nFor questions about these terms, contact support.', false),

('privacy-policy', 'Privacy Policy', E'# Privacy Policy\n\nLast Updated: ' || CURRENT_DATE || E'\n\n## 1. Information We Collect\n\nWe collect information you provide directly to us.\n\n## 2. How We Use Information\n\nWe use the information to provide our services.\n\n## 3. Contact Us\n\nFor privacy questions, contact support.', false),

('affiliate-disclosure', 'Affiliate Disclosure', E'# Affiliate Disclosure\n\nLast Updated: ' || CURRENT_DATE || E'\n\n## FTC Disclosure\n\nFunnelSwift operates an affiliate program. Affiliates may earn commissions on referred sales.\n\n## Transparency\n\nWe believe in transparency. All affiliate relationships are tracked per FTC guidelines.', false),

('cookie-policy', 'Cookie Policy', E'# Cookie Policy\n\nLast Updated: ' || CURRENT_DATE || E'\n\n## What Are Cookies\n\nCookies are small text files stored on your device.\n\n## How We Use Cookies\n\n- Essential cookies: Required for site functionality\n- Analytics cookies: Help us improve our service\n\n## Your Choices\n\nYou can manage cookie preferences in your browser settings.', false),

('refund-policy', 'Refund Policy', E'# Refund Policy\n\nLast Updated: ' || CURRENT_DATE || E'\n\n## Subscription Refunds\n\n[Add your refund policy here]\n\n## How to Request a Refund\n\nContact support within the refund period.', false)

ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

-- Super admin can manage all pages
CREATE POLICY "Super admin can manage legal pages"
  ON legal_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Everyone can view published pages
CREATE POLICY "Everyone can view published legal pages"
  ON legal_pages FOR SELECT
  USING (is_published = true);

-- ============================================
-- Footer Links Configuration
-- ============================================
CREATE TABLE footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link details
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  
  -- Position
  column_number INTEGER DEFAULT 1, -- 1, 2, or 3 columns
  sort_order INTEGER DEFAULT 0,
  
  -- Type
  link_type TEXT DEFAULT 'custom', -- 'legal', 'custom', 'social'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Default footer links
INSERT INTO footer_links (label, url, column_number, sort_order, link_type) VALUES
-- Column 1: Product
('Features', '/features', 1, 1, 'custom'),
('Pricing', '/pricing', 1, 2, 'custom'),
('Integrations', '/integrations', 1, 3, 'custom'),

-- Column 2: Legal
('Terms of Service', '/legal/terms-of-service', 2, 1, 'legal'),
('Privacy Policy', '/legal/privacy-policy', 2, 2, 'legal'),
('Affiliate Disclosure', '/legal/affiliate-disclosure', 2, 3, 'legal'),
('Cookie Policy', '/legal/cookie-policy', 2, 4, 'legal'),

-- Column 3: Company
('About', '/about', 3, 1, 'custom'),
('Contact', '/contact', 3, 2, 'custom'),
('Blog', '/blog', 3, 3, 'custom')

ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

-- Super admin can manage footer
CREATE POLICY "Super admin can manage footer links"
  ON footer_links FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Everyone can view footer links
CREATE POLICY "Everyone can view footer links"
  ON footer_links FOR SELECT
  USING (is_active = true);
