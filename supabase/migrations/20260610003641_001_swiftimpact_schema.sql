-- CONTACTS (single source of truth)
create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  first_name    text,
  last_name     text,
  email         text unique,
  phone         text unique,
  business_name text,
  website       text,
  industry      text,
  lead_score    integer default 0,
  status        text default 'new',
  source        text,
  campaign      text,
  preferred_contact text default 'sms',
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- TAGS
create table public.tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null,
  color text default '#5B4FFF'
);

-- CONTACT_TAGS
create table public.contact_tags (
  contact_id uuid references public.contacts(id) on delete cascade,
  tag_id     uuid references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- PIPELINES
create table public.pipelines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  is_active   boolean default true,
  sort_order  integer default 0
);

-- PIPELINE_STAGES
create table public.pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid references public.pipelines(id) on delete cascade,
  name        text not null,
  sort_order  integer default 0,
  color       text default '#5B4FFF'
);

-- PIPELINE_CONTACTS
create table public.pipeline_contacts (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid references public.contacts(id) on delete cascade,
  pipeline_id  uuid references public.pipelines(id) on delete cascade,
  stage_id     uuid references public.pipeline_stages(id),
  deal_value   numeric(12,2),
  moved_at     timestamptz default now()
);

-- EVENTS
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references public.contacts(id) on delete set null,
  event_type  text not null,
  source_app  text,
  payload     jsonb default '{}',
  created_at  timestamptz default now()
);

-- API_KEYS
create table public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  key_hash    text not null unique,
  app_name    text,
  permissions text[] default '{}',
  is_active   boolean default true,
  last_used   timestamptz,
  created_at  timestamptz default now(),
  expires_at  timestamptz
);

-- WEBHOOK_CONFIGS
create table public.webhook_configs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null,
  event_types text[] default '{}',
  is_active   boolean default true,
  secret      text,
  created_at  timestamptz default now()
);

-- CAPTURE_FORMS
create table public.capture_forms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  fields      jsonb default '[]',
  tags        text[] default '{}',
  pipeline_id uuid references public.pipelines(id),
  stage_id    uuid references public.pipeline_stages(id),
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Enable RLS on all tables
alter table public.contacts enable row level security;
alter table public.tags enable row level security;
alter table public.contact_tags enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_contacts enable row level security;
alter table public.events enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhook_configs enable row level security;
alter table public.capture_forms enable row level security;

-- RLS Policies for contacts
create policy "select_own_contacts" on public.contacts for select
  to authenticated using (true);
create policy "insert_contacts" on public.contacts for insert
  to authenticated with check (true);
create policy "update_contacts" on public.contacts for update
  to authenticated using (true);
create policy "delete_contacts" on public.contacts for delete
  to authenticated using (true);

-- RLS Policies for tags
create policy "select_tags" on public.tags for select to authenticated using (true);
create policy "insert_tags" on public.tags for insert to authenticated with check (true);
create policy "update_tags" on public.tags for update to authenticated using (true);
create policy "delete_tags" on public.tags for delete to authenticated using (true);

-- RLS Policies for contact_tags
create policy "select_contact_tags" on public.contact_tags for select to authenticated using (true);
create policy "insert_contact_tags" on public.contact_tags for insert to authenticated with check (true);
create policy "delete_contact_tags" on public.contact_tags for delete to authenticated using (true);

-- RLS Policies for pipelines
create policy "select_pipelines" on public.pipelines for select to authenticated using (true);
create policy "insert_pipelines" on public.pipelines for insert to authenticated with check (true);
create policy "update_pipelines" on public.pipelines for update to authenticated using (true);
create policy "delete_pipelines" on public.pipelines for delete to authenticated using (true);

-- RLS Policies for pipeline_stages
create policy "select_pipeline_stages" on public.pipeline_stages for select to authenticated using (true);
create policy "insert_pipeline_stages" on public.pipeline_stages for insert to authenticated with check (true);
create policy "update_pipeline_stages" on public.pipeline_stages for update to authenticated using (true);
create policy "delete_pipeline_stages" on public.pipeline_stages for delete to authenticated using (true);

-- RLS Policies for pipeline_contacts
create policy "select_pipeline_contacts" on public.pipeline_contacts for select to authenticated using (true);
create policy "insert_pipeline_contacts" on public.pipeline_contacts for insert to authenticated with check (true);
create policy "update_pipeline_contacts" on public.pipeline_contacts for update to authenticated using (true);
create policy "delete_pipeline_contacts" on public.pipeline_contacts for delete to authenticated using (true);

-- RLS Policies for events
create policy "select_events" on public.events for select to authenticated using (true);
create policy "insert_events" on public.events for insert to authenticated with check (true);

-- RLS Policies for api_keys
create policy "select_api_keys" on public.api_keys for select to authenticated using (true);
create policy "insert_api_keys" on public.api_keys for insert to authenticated with check (true);
create policy "update_api_keys" on public.api_keys for update to authenticated using (true);
create policy "delete_api_keys" on public.api_keys for delete to authenticated using (true);

-- RLS Policies for webhook_configs
create policy "select_webhook_configs" on public.webhook_configs for select to authenticated using (true);
create policy "insert_webhook_configs" on public.webhook_configs for insert to authenticated with check (true);
create policy "update_webhook_configs" on public.webhook_configs for update to authenticated using (true);
create policy "delete_webhook_configs" on public.webhook_configs for delete to authenticated using (true);

-- RLS Policies for capture_forms
create policy "select_capture_forms" on public.capture_forms for select using (true);
create policy "insert_capture_forms" on public.capture_forms for insert to authenticated with check (true);
create policy "update_capture_forms" on public.capture_forms for update to authenticated using (true);
create policy "delete_capture_forms" on public.capture_forms for delete to authenticated using (true);

-- SEED DATA: Pipelines
insert into public.pipelines (name, sort_order) values
  ('Agency Sales', 1),
  ('ADA Sales', 2),
  ('Missed Call SMS', 3),
  ('AI Agent Sales', 4),
  ('Directory Sales', 5),
  ('Newsletter Sponsors', 6);

-- SEED DATA: Tags
insert into public.tags (name, color) values
  ('ADA', '#5B4FFF'),
  ('Missed Call', '#F59E0B'),
  ('AI Agent', '#22C55E'),
  ('Hot Lead', '#EF4444'),
  ('Newsletter', '#06B6D4'),
  ('Directory', '#8B5CF6'),
  ('Facebook', '#3B82F6'),
  ('Google', '#10B981'),
  ('Cold Email', '#94A3B8'),
  ('SMS Demo', '#F97316'),
  ('Compliance Risk', '#EF4444'),
  ('Researched', '#A855F7');

-- SEED DATA: Pipeline Stages for each pipeline
insert into public.pipeline_stages (pipeline_id, name, sort_order, color)
select id, 'New Lead', 1, '#64748B' from public.pipelines where name = 'Agency Sales'
union all
select id, 'Qualified', 2, '#3B82F6' from public.pipelines where name = 'Agency Sales'
union all
select id, 'Appointment', 3, '#F59E0B' from public.pipelines where name = 'Agency Sales'
union all
select id, 'Proposal', 4, '#8B5CF6' from public.pipelines where name = 'Agency Sales'
union all
select id, 'Won', 5, '#22C55E' from public.pipelines where name = 'Agency Sales'
union all
select id, 'Lost', 6, '#EF4444' from public.pipelines where name = 'Agency Sales';

-- Create indexes for performance
create index idx_contacts_email on public.contacts(email);
create index idx_contacts_phone on public.contacts(phone);
create index idx_contacts_status on public.contacts(status);
create index idx_events_contact_id on public.events(contact_id);
create index idx_events_event_type on public.events(event_type);
create index idx_events_created_at on public.events(created_at desc);
create index idx_pipeline_contacts_contact on public.pipeline_contacts(contact_id);
create index idx_pipeline_contacts_pipeline on public.pipeline_contacts(pipeline_id);