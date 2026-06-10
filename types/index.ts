// Database types derived from schema
export type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  website: string | null;
  industry: string | null;
  lead_score: number;
  status: 'new' | 'contacted' | 'qualified' | 'customer' | 'lost';
  source: 'form' | 'sms' | 'demo_missed_call' | 'demo_ada' | 'demo_ai' | 'qr' | 'cold_email' | 'fb_ad' | 'manual' | 'external_api' | null;
  campaign: string | null;
  preferred_contact: 'sms' | 'email' | 'call';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type ContactTag = {
  contact_id: string;
  tag_id: string;
};

export type Pipeline = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type PipelineStage = {
  id: string;
  pipeline_id: string;
  name: string;
  sort_order: number;
  color: string;
};

export type PipelineContact = {
  id: string;
  contact_id: string;
  pipeline_id: string;
  stage_id: string | null;
  deal_value: number | null;
  moved_at: string;
};

export type Event = {
  id: string;
  contact_id: string | null;
  event_type: string;
  source_app: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ApiKey = {
  id: string;
  name: string;
  key_hash: string;
  app_name: string | null;
  permissions: string[];
  is_active: boolean;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
};

export type WebhookConfig = {
  id: string;
  name: string;
  url: string;
  event_types: string[];
  is_active: boolean;
  secret: string | null;
  created_at: string;
};

export type CaptureForm = {
  id: string;
  name: string;
  slug: string;
  fields: FormField[];
  tags: string[];
  pipeline_id: string | null;
  stage_id: string | null;
  is_active: boolean;
  created_at: string;
};

export type FormField = {
  name: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

// API request/response types
export type CreateLeadRequest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  website?: string;
  industry?: string;
  source: Contact['source'];
  campaign?: string;
  tags?: string[];
  pipeline?: string;
  lead_score?: number;
  payload?: Record<string, unknown>;
};

export type CreateEventRequest = {
  contact_id?: string;
  event_type: string;
  source_app?: string;
  payload?: Record<string, unknown>;
};

// Lead with related data for UI
export type LeadWithDetails = Contact & {
  tags: Tag[];
  pipeline_position?: {
    pipeline_id: string;
    pipeline_name: string;
    stage_id: string;
    stage_name: string;
    stage_color: string;
    deal_value: number | null;
  };
  recent_events: Event[];
};

// Lead tier for scoring
export type LeadTier = 'hot' | 'warm' | 'cold';

// Dashboard stats
export type DashboardStats = {
  total_leads: number;
  new_leads_today: number;
  hot_leads: number;
  conversion_rate: number;
  leads_by_source: Record<string, number>;
  recent_events: Event[];
};
