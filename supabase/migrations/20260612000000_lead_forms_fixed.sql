-- ============================================
-- LEAD FORMS SYSTEM - Fixed for FunnelSwift Schema
-- ============================================

-- Check if tenants table exists, if not create simple version
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
    CREATE TABLE tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Check if user_profiles exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      tenant_id UUID REFERENCES tenants(id),
      is_superadmin BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- Add tenant_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'tenant_id') THEN
      ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;
  END IF;
END $$;

-- ============================================
-- LEAD FORMS TABLES
-- ============================================

-- Lead Forms table
CREATE TABLE IF NOT EXISTS lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Get in Touch',
  description TEXT,
  
  -- Form Fields Configuration
  fields JSONB NOT NULL DEFAULT '[
    {"name": "first_name", "label": "First Name", "type": "text", "required": true},
    {"name": "last_name", "label": "Last Name", "type": "text", "required": true},
    {"name": "email", "label": "Email", "type": "email", "required": true},
    {"name": "phone", "label": "Phone", "type": "tel", "required": false}
  ]',
  
  -- Auto-tagging
  auto_tag_ids UUID[] DEFAULT '{}',
  auto_system_tag_ids UUID[] DEFAULT '{}',
  
  -- Form Settings
  submit_button_text TEXT DEFAULT 'Submit',
  success_message TEXT DEFAULT 'Thank you! We will be in touch soon.',
  success_redirect_url TEXT,
  
  -- Styling
  primary_color TEXT DEFAULT '#5B4FFF',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1a1a1a',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Embed tracking
  embed_count INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, slug)
);

-- Lead Form Submissions table
CREATE TABLE IF NOT EXISTS lead_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Submission Data
  form_data JSONB NOT NULL,
  
  -- Created Contact (if successful)
  contact_id UUID REFERENCES contacts(id),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_forms_tenant ON lead_forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_forms_slug ON lead_forms(slug);
CREATE INDEX IF NOT EXISTS idx_lead_forms_active ON lead_forms(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON lead_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant ON lead_form_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON lead_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON lead_form_submissions(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_form_submissions ENABLE ROW LEVEL SECURITY;

-- Simple RLS - allow all authenticated users (FunnelSwift is single-tenant per instance)
CREATE POLICY "Allow all authenticated on lead_forms"
  ON lead_forms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated on submissions"
  ON lead_form_submissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous submissions (for embeddable forms)
CREATE POLICY "Allow anonymous insert on submissions"
  ON lead_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================
-- AUTO-PROCESSING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION process_lead_form_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_form_record RECORD;
  v_contact_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_business_name TEXT;
  v_website TEXT;
BEGIN
  -- Get form configuration
  SELECT * INTO v_form_record
  FROM lead_forms
  WHERE id = NEW.form_id;

  IF NOT FOUND THEN
    NEW.status := 'failed';
    NEW.error_message := 'Form not found';
    RETURN NEW;
  END IF;

  -- Extract standard fields from form data
  v_first_name := NEW.form_data->>'first_name';
  v_last_name := NEW.form_data->>'last_name';
  v_email := NEW.form_data->>'email';
  v_phone := NEW.form_data->>'phone';
  v_business_name := NEW.form_data->>'business_name';
  v_website := NEW.form_data->>'website';

  -- Create contact
  INSERT INTO contacts (
    first_name,
    last_name,
    email,
    phone,
    business_name,
    website,
    source,
    status,
    lead_score
  ) VALUES (
    v_first_name,
    v_last_name,
    v_email,
    v_phone,
    v_business_name,
    v_website,
    'lead_form:' || v_form_record.slug,
    'new',
    50
  )
  RETURNING id INTO v_contact_id;

  -- Apply auto-tags (custom tags)
  IF array_length(v_form_record.auto_tag_ids, 1) > 0 THEN
    INSERT INTO contact_tags (contact_id, tag_id)
    SELECT v_contact_id, unnest(v_form_record.auto_tag_ids);
  END IF;

  -- Apply auto-tags (system tags)
  IF array_length(v_form_record.auto_system_tag_ids, 1) > 0 THEN
    INSERT INTO contact_tags (contact_id, system_tag_id)
    SELECT v_contact_id, unnest(v_form_record.auto_system_tag_ids);
  END IF;

  -- Update submission
  NEW.contact_id := v_contact_id;
  NEW.status := 'processed';
  NEW.tenant_id := v_form_record.tenant_id;

  -- Increment form submission count
  UPDATE lead_forms
  SET submission_count = submission_count + 1
  WHERE id = NEW.form_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  NEW.status := 'failed';
  NEW.error_message := SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-process submissions
DROP TRIGGER IF EXISTS on_lead_form_submission ON lead_form_submissions;
CREATE TRIGGER on_lead_form_submission
  BEFORE INSERT ON lead_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION process_lead_form_submission();

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Get or create a default tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (name, slug)
    VALUES ('Default Tenant', 'default')
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Insert sample lead form
  INSERT INTO lead_forms (
    tenant_id,
    name,
    slug,
    title,
    description,
    submit_button_text,
    success_message
  )
  SELECT 
    v_tenant_id,
    'Default Lead Form',
    'default',
    'Get Your Free Demo',
    'Enter your information and we will send you a personalized demo.',
    'Get My Free Demo',
    'Thank you! Check your email for your personalized demo.'
  WHERE NOT EXISTS (SELECT 1 FROM lead_forms WHERE slug = 'default');
END $$;

SELECT 'Lead forms system created successfully!' as status;
