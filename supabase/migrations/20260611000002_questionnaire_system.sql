-- Questionnaire System with Auto-Fields & Campaign Tracking

-- ============================================
-- Custom Fields (auto-created from questionnaires)
-- ============================================
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Field definition
  field_name TEXT NOT NULL, -- 'industry', 'employee_count', etc.
  field_label TEXT NOT NULL, -- 'Industry', 'Employee Count'
  field_type TEXT NOT NULL, -- 'text', 'number', 'select', 'multiselect', 'date', 'email', 'phone'
  
  -- Options for select/multiselect
  options JSONB DEFAULT '[]', -- [{"value": "retail", "label": "Retail"}]
  
  -- Source
  source_questionnaire_id UUID, -- Which questionnaire created this field
  
  -- Display
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint per tenant
CREATE UNIQUE INDEX idx_custom_fields_name_tenant ON custom_fields(field_name, tenant_id);

-- ============================================
-- Contact Custom Field Values
-- ============================================
CREATE TABLE contact_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  custom_field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
  
  -- Value (stored as text, cast based on field_type)
  value_text TEXT,
  value_number DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_contact_custom_values_contact ON contact_custom_field_values(contact_id);
CREATE INDEX idx_contact_custom_values_field ON contact_custom_field_values(custom_field_id);

-- ============================================
-- Questionnaires
-- ============================================
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Type
  type TEXT DEFAULT 'short', -- 'short' (4 questions), 'long' (10+), 'custom'
  
  -- Questions (JSON array)
  questions JSONB DEFAULT '[]',
  
  -- Scoring logic
  scoring_enabled BOOLEAN DEFAULT false,
  scoring_rules JSONB DEFAULT '{}', -- {"retail": 5, "asap": 20}
  
  -- Auto-tagging based on score
  score_tags JSONB DEFAULT '[]', -- [{"min": 80, "max": 100, "tag": "hot-lead"}]
  
  -- Redirect rules based on score
  score_redirects JSONB DEFAULT '[]', -- [{"min": 80, "url": "https://..."}]
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  show_progress_bar BOOLEAN DEFAULT true,
  allow_back_button BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  
  -- Styling
  theme_color TEXT DEFAULT '#5B4FFF',
  background_image TEXT,
  
  -- On complete
  on_complete_action TEXT DEFAULT 'create_lead',
  on_complete_redirect_url TEXT,
  on_complete_message TEXT,
  auto_assign_tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique slug per tenant
CREATE UNIQUE INDEX idx_questionnaires_slug_tenant ON questionnaires(slug, tenant_id);

-- ============================================
-- Questionnaire Responses
-- ============================================
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES questionnaires(id),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Contact info captured
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  
  -- All answers
  answers JSONB DEFAULT '{}',
  
  -- Score (if scoring enabled)
  score INTEGER,
  max_score INTEGER,
  
  -- Campaign tracking (UTM)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Affiliate tracking
  affiliate_code TEXT,
  referred_by_user_id UUID,
  
  -- Lead created from this?
  lead_id UUID REFERENCES contacts(id),
  
  -- Metadata
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  source TEXT, -- 'embed', 'direct', 'popup'
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_questionnaire_responses_questionnaire ON questionnaire_responses(questionnaire_id);
CREATE INDEX idx_questionnaire_responses_email ON questionnaire_responses(email);
CREATE INDEX idx_questionnaire_responses_utm ON questionnaire_responses(utm_source, utm_campaign);
CREATE INDEX idx_questionnaire_responses_affiliate ON questionnaire_responses(affiliate_code);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own
CREATE POLICY "Tenants can manage own custom fields"
  ON custom_fields FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY "Tenants can manage own questionnaires"
  ON questionnaires FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY "Tenants can view own responses"
  ON questionnaire_responses FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Super admin can see all
CREATE POLICY "Super admin can view all questionnaire data"
  ON questionnaires FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "Super admin can view all responses"
  ON questionnaire_responses FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin = true));

-- ============================================
-- Function to auto-create custom fields from questionnaire
-- ============================================
CREATE OR REPLACE FUNCTION create_custom_fields_from_questionnaire()
RETURNS TRIGGER AS $$
DECLARE
  question JSONB;
  field_name TEXT;
  field_label TEXT;
  field_type TEXT;
  options JSONB;
BEGIN
  -- Loop through questions
  FOR question IN SELECT * FROM jsonb_array_elements(NEW.questions)
  LOOP
    field_name := question->>'field_name';
    field_label := question->>'question';
    field_type := question->>'type';
    options := question->'options';
    
    -- Skip if no field_name (not a field-creating question)
    IF field_name IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Create custom field if doesn't exist
    INSERT INTO custom_fields (
      tenant_id,
      field_name,
      field_label,
      field_type,
      options,
      source_questionnaire_id
    )
    VALUES (
      NEW.tenant_id,
      field_name,
      field_label,
      field_type,
      COALESCE(options, '[]'::jsonb),
      NEW.id
    )
    ON CONFLICT (field_name, tenant_id) 
    DO UPDATE SET
      field_label = EXCLUDED.field_label,
      field_type = EXCLUDED.field_type,
      options = EXCLUDED.options;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create fields when questionnaire saved
CREATE TRIGGER auto_create_custom_fields
  AFTER INSERT OR UPDATE ON questionnaires
  FOR EACH ROW
  WHEN (NEW.questions IS NOT NULL)
  EXECUTE FUNCTION create_custom_fields_from_questionnaire();

-- ============================================
-- Function to populate custom fields from questionnaire response
-- ============================================
CREATE OR REPLACE FUNCTION populate_custom_fields_from_response()
RETURNS TRIGGER AS $$
DECLARE
  answer_record RECORD;
  custom_field_id UUID;
  field_value TEXT;
  field_type TEXT;
BEGIN
  -- Only process if lead was created
  IF NEW.lead_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Loop through answers
  FOR answer_record IN 
    SELECT * FROM jsonb_each_text(NEW.answers)
  LOOP
    -- Find the custom field
    SELECT id, field_type INTO custom_field_id, field_type
    FROM custom_fields
    WHERE field_name = answer_record.key
    AND tenant_id = NEW.tenant_id;
    
    IF custom_field_id IS NOT NULL THEN
      -- Insert or update the value
      INSERT INTO contact_custom_field_values (
        contact_id,
        custom_field_id,
        value_text,
        value_number
      )
      VALUES (
        NEW.lead_id,
        custom_field_id,
        answer_record.value,
        CASE WHEN field_type = 'number' THEN answer_record.value::DECIMAL ELSE NULL END
      )
      ON CONFLICT (contact_id, custom_field_id)
      DO UPDATE SET
        value_text = EXCLUDED.value_text,
        value_number = EXCLUDED.value_number,
        updated_at = now();
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to populate fields when response completed
CREATE TRIGGER auto_populate_custom_fields
  AFTER UPDATE ON questionnaire_responses
  FOR EACH ROW
  WHEN (NEW.lead_id IS NOT NULL AND OLD.lead_id IS NULL)
  EXECUTE FUNCTION populate_custom_fields_from_response();
