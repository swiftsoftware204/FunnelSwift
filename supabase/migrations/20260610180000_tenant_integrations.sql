-- Tenant Integrations Schema
-- Allows tenants to add their own API keys and configure custom integrations

-- ============================================
-- Create tenant_integrations table
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Integration details
  provider_id TEXT NOT NULL, -- 'adaswift', 'missedcall', 'mintbird', 'hubspot', etc.
  name TEXT NOT NULL, -- Custom name given by tenant
  
  -- Credentials (encrypted)
  credentials JSONB DEFAULT '{}',
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Webhook configuration (if this integration receives webhooks)
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_provider ON tenant_integrations(provider_id);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_active ON tenant_integrations(is_active);

-- Enable RLS
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view own integrations"
  ON tenant_integrations
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY "Tenants can manage own integrations"
  ON tenant_integrations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

-- Super admin can see all
CREATE POLICY "Super admin can view all integrations"
  ON tenant_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- ============================================
-- Create integration_execution_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS integration_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_integration_id UUID REFERENCES tenant_integrations(id) ON DELETE CASCADE,
  
  -- Execution details
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  response JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL, -- 'success', 'error', 'pending'
  error_message TEXT,
  
  -- Performance
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant_integration ON integration_execution_logs(tenant_integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_execution_logs(created_at);

-- Enable RLS
ALTER TABLE integration_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view own integration logs"
  ON integration_execution_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_integrations ti
      WHERE ti.id = integration_execution_logs.tenant_integration_id
      AND ti.tenant_id = current_setting('app.current_tenant')::UUID
    )
  );

-- ============================================
-- Create integration_webhooks_received table
-- ============================================
CREATE TABLE IF NOT EXISTS integration_webhooks_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_integration_id UUID REFERENCES tenant_integrations(id) ON DELETE CASCADE,
  
  -- Webhook details
  provider_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  
  -- Processing status
  status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'error'
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Raw data for debugging
  raw_body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_received_integration ON integration_webhooks_received(tenant_integration_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_received_status ON integration_webhooks_received(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_received_created ON integration_webhooks_received(created_at);

-- Enable RLS
ALTER TABLE integration_webhooks_received ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Function to update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenant_integrations
DROP TRIGGER IF EXISTS tenant_integrations_updated_at ON tenant_integrations;
CREATE TRIGGER tenant_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Enable realtime for integration logs
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE integration_execution_logs;
