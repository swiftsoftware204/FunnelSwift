-- FunnelSwift Email Templates (ADMIN ONLY)
-- Tenants cannot see or edit these

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL, -- 'demo_welcome', 'affiliate_welcome', etc.
  template_name TEXT NOT NULL, -- Display name for admin
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT, -- Plain text fallback
  from_name TEXT DEFAULT 'FunnelSwift',
  from_email TEXT DEFAULT 'hello@funnelswift.com',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default templates with placeholders
INSERT INTO email_templates (template_key, template_name, subject, html_content, text_content) VALUES
(
  'demo_welcome',
  'Demo Welcome Email',
  'Your FunnelSwift Demo is Ready!',
  '<h1>Welcome to FunnelSwift, {{firstName}}!</h1>
<p>Your 30-day demo is active.</p>
<p><strong>Demo Code:</strong> {{demoCode}}</p>
<p><strong>Trial Ends:</strong> {{trialEndsAt}}</p>
<p><a href="{{loginUrl}}">Login to Your Account</a></p>
<p><a href="{{upgradeUrl}}" style="padding:12px 24px;background:#5B4FFF;color:white;text-decoration:none;border-radius:5px;">Upgrade Now</a></p>',
  'Welcome to FunnelSwift! Your demo code is {{demoCode}}. Login: {{loginUrl}}'
),
(
  'affiliate_welcome',
  'Affiliate Welcome Email',
  'Welcome to FunnelSwift Affiliate Program!',
  '<h1>Welcome, {{firstName}}!</h1>
<p>Your affiliate account is ready.</p>
<p><strong>Login:</strong> {{loginUrl}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Temporary Password:</strong> {{tempPassword}}</p>
<p><strong>Your Affiliate Link:</strong> {{affiliateLink}}</p>
<p><a href="{{dashboardUrl}}" style="padding:12px 24px;background:#5B4FFF;color:white;text-decoration:none;border-radius:5px;">Go to Dashboard</a></p>',
  'Welcome! Login: {{loginUrl}} | Email: {{email}} | Password: {{tempPassword}} | Affiliate Link: {{affiliateLink}}'
),
(
  'trial_expiring',
  'Trial Expiring Soon',
  'Your FunnelSwift Trial Expires Soon',
  '<h1>Hi {{firstName}},</h1>
<p>Your demo expires on {{trialEndsAt}}.</p>
<p>Don''t lose your funnels!</p>
<p><a href="{{upgradeUrl}}" style="padding:12px 24px;background:#5B4FFF;color:white;text-decoration:none;border-radius:5px;">Upgrade Now</a></p>',
  'Your demo expires on {{trialEndsAt}}. Upgrade: {{upgradeUrl}}'
),
(
  'trial_expired',
  'Trial Expired',
  'Your FunnelSwift Demo Has Expired',
  '<h1>Hi {{firstName}},</h1>
<p>Your demo has expired.</p>
<p>Upgrade now to keep your account:</p>
<p><a href="{{upgradeUrl}}" style="padding:12px 24px;background:#5B4FFF;color:white;text-decoration:none;border-radius:5px;">Upgrade Now</a></p>',
  'Your demo expired. Upgrade: {{upgradeUrl}}'
)
ON CONFLICT (template_key) DO NOTHING;

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ONLY Super Admin can view/edit email templates
DROP POLICY IF EXISTS "Super admin can manage email templates" ON email_templates;
CREATE POLICY "Super admin can manage email templates"
  ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- Tenants CANNOT see email templates at all
-- No SELECT policy for regular users

-- Trigger for updated_at
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
