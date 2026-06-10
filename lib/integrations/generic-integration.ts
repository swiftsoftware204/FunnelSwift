// Generic Integration System
// Allows tenants to add their own API keys and configure custom integrations

import { createClient } from '@/lib/supabase/client';

export interface IntegrationProvider {
  id: string;
  name: string;
  category: 'payment' | 'crm' | 'email' | 'sms' | 'webhook' | 'swiftsoftware';
  description: string;
  icon?: string;
  
  // Required credentials
  requiredCredentials: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'textarea';
    placeholder?: string;
    required: boolean;
  }[];
  
  // Optional settings
  optionalSettings?: {
    key: string;
    label: string;
    type: 'text' | 'select' | 'checkbox';
    options?: string[];
    defaultValue?: any;
  }[];
  
  // Webhook configuration (if applicable)
  webhookConfig?: {
    supportsIncoming: boolean;
    supportsOutgoing: boolean;
    defaultEvents?: string[];
  };
}

export interface TenantIntegration {
  id: string;
  tenant_id: string;
  provider_id: string;
  name: string; // Custom name given by tenant
  
  // Encrypted credentials
  credentials: Record<string, string>;
  
  // Settings
  settings: Record<string, any>;
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  last_verified_at?: string;
  last_error?: string;
  
  // Webhook URL (if this integration receives webhooks)
  webhook_url?: string;
  webhook_secret?: string;
  
  created_at: string;
  updated_at: string;
}

// Pre-defined integration providers
export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  // SwiftSoftware Sister Products
  {
    id: 'adaswift',
    name: 'ADASwift',
    category: 'swiftsoftware',
    description: 'Connect to ADASwift for widget delivery and management',
    icon: '🎯',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'ADASwift API Key',
        type: 'password',
        placeholder: 'Enter your ADASwift API key',
        required: true,
      },
      {
        key: 'api_url',
        label: 'ADASwift API URL',
        type: 'text',
        placeholder: 'https://app.adaswift.com/api',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'default_plan',
        label: 'Default Widget Plan',
        type: 'select',
        options: ['free_trial', 'starter', 'pro', 'enterprise'],
        defaultValue: 'free_trial',
      },
    ],
    webhookConfig: {
      supportsIncoming: true,
      supportsOutgoing: true,
      defaultEvents: ['widget.created', 'widget.installed', 'widget.upgraded'],
    },
  },
  {
    id: 'missedcall',
    name: 'Missed Call Responder',
    category: 'swiftsoftware',
    description: 'Connect to Missed Call Responder for SMS automation',
    icon: '📞',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'MissedCall API Key',
        type: 'password',
        placeholder: 'Enter your MissedCall API key',
        required: true,
      },
      {
        key: 'api_url',
        label: 'MissedCall API URL',
        type: 'text',
        placeholder: 'https://missedcall.example.com/api',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'trial_days',
        label: 'Default Trial Period (days)',
        type: 'text',
        defaultValue: '14',
      },
    ],
    webhookConfig: {
      supportsIncoming: true,
      supportsOutgoing: true,
      defaultEvents: ['demo.created', 'demo.activated', 'sms.received'],
    },
  },
  {
    id: 'workflowswift',
    name: 'WorkflowSwift',
    category: 'swiftsoftware',
    description: 'Connect to WorkflowSwift for advanced automation',
    icon: '⚡',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'WorkflowSwift API Key',
        type: 'password',
        placeholder: 'Enter your WorkflowSwift API key',
        required: true,
      },
      {
        key: 'api_url',
        label: 'WorkflowSwift API URL',
        type: 'text',
        placeholder: 'https://workflowswift.example.com/api',
        required: true,
      },
    ],
    webhookConfig: {
      supportsIncoming: true,
      supportsOutgoing: true,
      defaultEvents: ['workflow.triggered', 'workflow.completed'],
    },
  },
  
  // External Payment/Affiliate Platforms
  {
    id: 'mintbird',
    name: 'MintBird',
    category: 'payment',
    description: 'Connect to MintBird for checkout and affiliate tracking',
    icon: '🛒',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'MintBird API Key',
        type: 'password',
        placeholder: 'Enter your MintBird API key',
        required: true,
      },
      {
        key: 'api_secret',
        label: 'MintBird API Secret',
        type: 'password',
        placeholder: 'Enter your MintBird API secret',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'webhook_secret',
        label: 'Webhook Secret (for verification)',
        type: 'password',
        placeholder: 'Optional: for webhook security',
        required: false,
      },
    ],
    webhookConfig: {
      supportsIncoming: true,
      supportsOutgoing: false,
      defaultEvents: ['sale.completed', 'refund.processed', 'subscription.renewed'],
    },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    description: 'Connect to Stripe for payments',
    icon: '💳',
    requiredCredentials: [
      {
        key: 'secret_key',
        label: 'Stripe Secret Key',
        type: 'password',
        placeholder: 'sk_live_...',
        required: true,
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Endpoint Secret',
        type: 'password',
        placeholder: 'whsec_...',
        required: false,
      },
    ],
    webhookConfig: {
      supportsIncoming: true,
      supportsOutgoing: false,
      defaultEvents: ['payment_intent.succeeded', 'invoice.paid', 'customer.subscription.created'],
    },
  },
  
  // CRM Platforms
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Sync leads to HubSpot CRM',
    icon: '📊',
    requiredCredentials: [
      {
        key: 'access_token',
        label: 'HubSpot Private App Token',
        type: 'password',
        placeholder: 'Enter your HubSpot access token',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'default_pipeline',
        label: 'Default Pipeline',
        type: 'text',
        placeholder: 'e.g., Sales Pipeline',
      },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Sync leads to Salesforce',
    icon: '☁️',
    requiredCredentials: [
      {
        key: 'client_id',
        label: 'Consumer Key',
        type: 'text',
        required: true,
      },
      {
        key: 'client_secret',
        label: 'Consumer Secret',
        type: 'password',
        required: true,
      },
      {
        key: 'refresh_token',
        label: 'Refresh Token',
        type: 'password',
        required: true,
      },
    ],
  },
  
  // Email Marketing
  {
    id: 'sendiio',
    name: 'Sendiio',
    category: 'email',
    description: 'Add contacts to Sendiio lists (your primary platform)',
    icon: '📧',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'Sendiio API Key',
        type: 'password',
        placeholder: 'Enter your Sendiio API key',
        required: true,
      },
      {
        key: 'api_secret',
        label: 'Sendiio API Secret',
        type: 'password',
        placeholder: 'Enter your Sendiio API secret',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'default_list_id',
        label: 'Default List ID',
        type: 'text',
        placeholder: 'List ID for new contacts',
      },
      {
        key: 'tag_sync',
        label: 'Sync Tags to Sendiio',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'email',
    description: 'Add contacts to Mailchimp lists',
    icon: '📧',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'Mailchimp API Key',
        type: 'password',
        placeholder: 'Enter your Mailchimp API key',
        required: true,
      },
      {
        key: 'server_prefix',
        label: 'Server Prefix',
        type: 'text',
        placeholder: 'e.g., us1',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'default_list_id',
        label: 'Default List ID',
        type: 'text',
        placeholder: 'Audience ID',
      },
    ],
  },
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    category: 'email',
    description: 'Add contacts to ActiveCampaign',
    icon: '📨',
    requiredCredentials: [
      {
        key: 'api_url',
        label: 'API URL',
        type: 'text',
        placeholder: 'https://youraccount.api-us1.com',
        required: true,
      },
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
      },
    ],
  },
  
  // Generic Webhook
  {
    id: 'custom_webhook',
    name: 'Custom Webhook',
    category: 'webhook',
    description: 'Send data to any custom webhook URL',
    icon: '🔌',
    requiredCredentials: [
      {
        key: 'webhook_url',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://your-app.com/webhook',
        required: true,
      },
    ],
    optionalSettings: [
      {
        key: 'headers',
        label: 'Custom Headers (JSON)',
        type: 'textarea',
        placeholder: '{"Authorization": "Bearer token"}',
      },
      {
        key: 'events',
        label: 'Events to Send',
        type: 'textarea',
        placeholder: 'lead_created, tag_assigned',
      },
    ],
    webhookConfig: {
      supportsIncoming: false,
      supportsOutgoing: true,
      defaultEvents: ['lead_created', 'lead_updated', 'tag_assigned'],
    },
  },
];

// Integration Manager Class
export class IntegrationManager {
  private supabase = createClient();
  
  // Get all available providers
  getProviders(): IntegrationProvider[] {
    return INTEGRATION_PROVIDERS;
  }
  
  // Get providers by category
  getProvidersByCategory(category: IntegrationProvider['category']): IntegrationProvider[] {
    return INTEGRATION_PROVIDERS.filter(p => p.category === category);
  }
  
  // Get SwiftSoftware providers
  getSwiftSoftwareProviders(): IntegrationProvider[] {
    return this.getProvidersByCategory('swiftsoftware');
  }
  
  // Get tenant's configured integrations
  async getTenantIntegrations(tenantId: string): Promise<TenantIntegration[]> {
    const { data, error } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // Add new integration
  async addIntegration(
    tenantId: string,
    providerId: string,
    name: string,
    credentials: Record<string, string>,
    settings: Record<string, any> = {}
  ): Promise<TenantIntegration> {
    const provider = INTEGRATION_PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error('Provider not found');
    
    // Validate required credentials
    for (const cred of provider.requiredCredentials) {
      if (cred.required && !credentials[cred.key]) {
        throw new Error(`${cred.label} is required`);
      }
    }
    
    // Encrypt credentials (in production, use proper encryption)
    const encryptedCredentials = this.encryptCredentials(credentials);
    
    const { data, error } = await this.supabase
      .from('tenant_integrations')
      .insert({
        tenant_id: tenantId,
        provider_id: providerId,
        name,
        credentials: encryptedCredentials,
        settings,
        is_active: false, // Start inactive until verified
        is_verified: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Try to verify the integration
    await this.verifyIntegration(data.id);
    
    return data;
  }
  
  // Verify integration credentials work
  async verifyIntegration(integrationId: string): Promise<boolean> {
    const { data: integration } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();
    
    if (!integration) return false;
    
    const provider = INTEGRATION_PROVIDERS.find(p => p.id === integration.provider_id);
    if (!provider) return false;
    
    try {
      // Attempt to verify credentials
      const isValid = await this.testCredentials(provider, integration.credentials);
      
      await this.supabase
        .from('tenant_integrations')
        .update({
          is_verified: isValid,
          is_active: isValid,
          last_verified_at: new Date().toISOString(),
          last_error: isValid ? null : 'Verification failed',
        })
        .eq('id', integrationId);
      
      return isValid;
    } catch (error: any) {
      await this.supabase
        .from('tenant_integrations')
        .update({
          is_verified: false,
          is_active: false,
          last_error: error.message,
        })
        .eq('id', integrationId);
      
      return false;
    }
  }
  
  // Test credentials with provider
  private async testCredentials(
    provider: IntegrationProvider,
    credentials: Record<string, string>
  ): Promise<boolean> {
    // Implementation depends on provider
    // This would make a test API call
    
    switch (provider.id) {
      case 'adaswift':
        return this.testADASwift(credentials);
      case 'missedcall':
        return this.testMissedCall(credentials);
      case 'mintbird':
        return this.testMintBird(credentials);
      case 'custom_webhook':
        return this.testWebhook(credentials);
      default:
        return true; // Assume valid for unknown providers
    }
  }
  
  private async testADASwift(creds: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(`${creds.api_url}/health`, {
        headers: { 'Authorization': `Bearer ${creds.api_key}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async testMissedCall(creds: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(`${creds.api_url}/health`, {
        headers: { 'X-API-Key': creds.api_key },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async testMintBird(creds: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('https://api.mintbird.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'X-API-Secret': creds.api_secret,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async testWebhook(creds: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch(creds.webhook_url, {
        method: 'HEAD',
      });
      return response.status !== 404;
    } catch {
      return false;
    }
  }
  
  // Execute integration action
  async executeIntegration(
    integrationId: string,
    action: string,
    payload: any
  ): Promise<any> {
    const { data: integration } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();
    
    if (!integration || !integration.is_active) {
      throw new Error('Integration not found or inactive');
    }
    
    const provider = INTEGRATION_PROVIDERS.find(p => p.id === integration.provider_id);
    if (!provider) throw new Error('Provider not found');
    
    // Decrypt credentials
    const credentials = this.decryptCredentials(integration.credentials);
    
    // Execute based on provider
    switch (provider.id) {
      case 'adaswift':
        return this.executeADASwift(credentials, action, payload);
      case 'missedcall':
        return this.executeMissedCall(credentials, action, payload);
      case 'mintbird':
        return this.executeMintBird(credentials, action, payload);
      case 'custom_webhook':
        return this.executeWebhook(credentials, action, payload);
      default:
        throw new Error('Provider execution not implemented');
    }
  }
  
  private async executeADASwift(
    creds: Record<string, string>,
    action: string,
    payload: any
  ): Promise<any> {
    const response = await fetch(`${creds.api_url}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.api_key}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`ADASwift API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async executeMissedCall(
    creds: Record<string, string>,
    action: string,
    payload: any
  ): Promise<any> {
    const response = await fetch(`${creds.api_url}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.api_key,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`MissedCall API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async executeMintBird(
    creds: Record<string, string>,
    action: string,
    payload: any
  ): Promise<any> {
    // Implementation for MintBird API
    const response = await fetch(`https://api.mintbird.com/v1/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.api_key}`,
        'X-API-Secret': creds.api_secret,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`MintBird API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async executeWebhook(
    creds: Record<string, string>,
    action: string,
    payload: any
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add custom headers if configured
    if (creds.headers) {
      try {
        const customHeaders = JSON.parse(creds.headers);
        Object.assign(headers, customHeaders);
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    const response = await fetch(creds.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Sync contact tags to email marketing platforms
  async syncContactToEmailPlatform(
    tenantId: string,
    contact: {
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      tags?: string[];
    }
  ): Promise<void> {
    // Get all email marketing integrations for this tenant
    const { data: integrations } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('provider_id', ['sendiio', 'mailchimp', 'activecampaign'])
      .eq('is_active', true);

    if (!integrations || integrations.length === 0) return;

    // Sync to each platform
    for (const integration of integrations) {
      try {
        const credentials = this.decryptCredentials(integration.credentials);
        
        switch (integration.provider_id) {
          case 'sendiio':
            await this.syncToSendiio(credentials, contact, integration.settings);
            break;
          case 'mailchimp':
            await this.syncToMailchimp(credentials, contact, integration.settings);
            break;
          case 'activecampaign':
            await this.syncToActiveCampaign(credentials, contact, integration.settings);
            break;
        }
      } catch (error) {
        console.error(`Failed to sync to ${integration.provider_id}:`, error);
      }
    }
  }

  private async syncToSendiio(
    creds: Record<string, string>,
    contact: any,
    settings: any
  ): Promise<void> {
    const response = await fetch('https://sendiio.com/api/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': creds.api_key,
        'X-API-SECRET': creds.api_secret,
      },
      body: JSON.stringify({
        email: contact.email,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        list_id: settings?.default_list_id,
        tags: contact.tags || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Sendiio sync error: ${response.statusText}`);
    }
  }

  private async syncToMailchimp(
    creds: Record<string, string>,
    contact: any,
    settings: any
  ): Promise<void> {
    const datacenter = creds.server_prefix;
    const listId = settings?.default_list_id;
    
    const response = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.api_key}`,
      },
      body: JSON.stringify({
        email_address: contact.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: contact.first_name || '',
          LNAME: contact.last_name || '',
          PHONE: contact.phone || '',
        },
        tags: (contact.tags || []).map((tag: string) => ({ name: tag })),
      }),
    });

    if (!response.ok && response.status !== 400) { // 400 = already subscribed
      throw new Error(`Mailchimp sync error: ${response.statusText}`);
    }
  }

  private async syncToActiveCampaign(
    creds: Record<string, string>,
    contact: any,
    settings: any
  ): Promise<void> {
    const response = await fetch(`${creds.api_url}/api/3/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': creds.api_key,
      },
      body: JSON.stringify({
        contact: {
          email: contact.email,
          firstName: contact.first_name || '',
          lastName: contact.last_name || '',
          phone: contact.phone || '',
          tags: contact.tags || [],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ActiveCampaign sync error: ${response.statusText}`);
    }
  }

  // Encryption helpers (use proper encryption in production)
  private encryptCredentials(credentials: Record<string, string>): Record<string, string> {
    // TODO: Implement proper encryption
    // For now, just return as-is (NOT for production!)
    return credentials;
  }
  
  private decryptCredentials(encrypted: Record<string, string>): Record<string, string> {
    // TODO: Implement proper decryption
    return encrypted;
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();
