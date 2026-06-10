'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  integrationManager,
  INTEGRATION_PROVIDERS,
  IntegrationProvider,
} from '@/lib/integrations/generic-integration';
import {
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Settings,
  Lock,
  Globe,
  CreditCard,
  Mail,
  Phone,
  Zap,
} from 'lucide-react';

const categoryIcons: Record<string, any> = {
  swiftsoftware: Zap,
  payment: CreditCard,
  crm: Globe,
  email: Mail,
  sms: Phone,
  webhook: ExternalLink,
};

const categoryLabels: Record<string, string> = {
  swiftsoftware: 'SwiftSoftware Products',
  payment: 'Payment & Affiliate',
  crm: 'CRM Platforms',
  email: 'Email Marketing',
  sms: 'SMS Services',
  webhook: 'Custom Webhooks',
};

export default function TenantIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formName, setFormName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setLoading(true);
    // TODO: Get actual tenant ID from auth context
    const tenantId = 'current-tenant-id';
    
    try {
      const data = await integrationManager.getTenantIntegrations(tenantId);
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    }
    
    setLoading(false);
  }

  async function handleCreateIntegration() {
    if (!selectedProvider || !formName.trim()) {
      toast.error('Please select a provider and enter a name');
      return;
    }

    // Validate required fields
    for (const cred of selectedProvider.requiredCredentials) {
      if (cred.required && !formData[cred.key]) {
        toast.error(`${cred.label} is required`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // TODO: Get actual tenant ID from auth context
      const tenantId = 'current-tenant-id';
      
      const integration = await integrationManager.addIntegration(
        tenantId,
        selectedProvider.id,
        formName,
        formData,
        {} // settings
      );

      toast.success(`${selectedProvider.name} integration added successfully`);
      setCreateDialogOpen(false);
      setFormData({});
      setFormName('');
      setSelectedProvider(null);
      loadIntegrations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add integration');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyIntegration(integrationId: string) {
    toast.info('Verifying integration...');
    
    try {
      const isValid = await integrationManager.verifyIntegration(integrationId);
      
      if (isValid) {
        toast.success('Integration verified successfully');
      } else {
        toast.error('Integration verification failed');
      }
      
      loadIntegrations();
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    }
  }

  async function handleDeleteIntegration(integrationId: string) {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      await supabase
        .from('tenant_integrations')
        .delete()
        .eq('id', integrationId);

      toast.success('Integration deleted');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to delete integration');
    }
  }

  function handleProviderSelect(providerId: string) {
    const provider = INTEGRATION_PROVIDERS.find(p => p.id === providerId);
    setSelectedProvider(provider || null);
    setFormData({});
  }

  const groupedProviders = INTEGRATION_PROVIDERS.reduce((acc, provider) => {
    if (!acc[provider.category]) {
      acc[provider.category] = [];
    }
    acc[provider.category].push(provider);
    return acc;
  }, {} as Record<string, IntegrationProvider[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Integrations</h1>
          <p className="text-[#64748B] mt-1">
            Connect FunnelSwift with your favorite tools
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Active Integrations */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#5B4FFF]" />
            Your Connected Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-[#64748B]">
              <p>No integrations configured yet.</p>
              <p className="text-sm mt-2">
                Click "Add Integration" to connect your tools.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => {
                const provider = INTEGRATION_PROVIDERS.find(
                  p => p.id === integration.provider_id
                );
                const Icon = provider ? categoryIcons[provider.category] : Settings;

                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{provider?.icon || '🔌'}</div>
                      <div>
                        <h3 className="font-medium text-[#F1F5F9]">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          {provider?.name || integration.provider_id}
                        </p>
                        {integration.last_error && (
                          <p className="text-xs text-red-400 mt-1">
                            Error: {integration.last_error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={integration.is_active ? 'default' : 'secondary'}
                        className={
                          integration.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {integration.is_active ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2A2D38]"
                        onClick={() => handleVerifyIntegration(integration.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteIntegration(integration.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="swiftsoftware">
            <TabsList className="bg-[#0E0F12] border border-[#2A2D38]">
              {Object.keys(groupedProviders).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-[#5B4FFF] data-[state=active]:text-white"
                >
                  {categoryLabels[category] || category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(groupedProviders).map(([category, providers]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer"
                      onClick={() => {
                        handleProviderSelect(provider.id);
                        setCreateDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{provider.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#F1F5F9]">
                            {provider.name}
                          </h3>
                          <p className="text-sm text-[#64748B] mt-1">
                            {provider.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {provider.webhookConfig?.supportsIncoming && (
                              <Badge variant="outline" className="text-xs">
                                Receives Webhooks
                              </Badge>
                            )}
                            {provider.webhookConfig?.supportsOutgoing && (
                              <Badge variant="outline" className="text-xs">
                                Sends Webhooks
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Integration Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] text-[#F1F5F9] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider?.icon && <span className="text-2xl">{selectedProvider.icon}</span>}
              Add {selectedProvider?.name || 'Integration'}
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              {selectedProvider?.description || 'Configure your integration settings'}
            </DialogDescription>
          </DialogHeader>

          {!selectedProvider ? (
            <div className="space-y-4">
              <label className="text-sm font-medium text-[#F1F5F9]">
                Select Integration Type
              </label>
              <Select onValueChange={handleProviderSelect}>
                <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38]">
                  <SelectValue placeholder="Choose a provider..." />
                </SelectTrigger>
                <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                  {INTEGRATION_PROVIDERS.map((provider) => (
                    <SelectItem
                      key={provider.id}
                      value={provider.id}
                      className="text-[#F1F5F9]"
                    >
                      <span className="mr-2">{provider.icon}</span>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#64748B]"
                onClick={() => setSelectedProvider(null)}
              >
                ← Back to providers
              </Button>

              <div>
                <label className="text-sm font-medium text-[#F1F5F9]">
                  Integration Name
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={`My ${selectedProvider.name} Connection`}
                  className="bg-[#0E0F12] border-[#2A2D38] mt-1"
                />
              </div>

              {selectedProvider.requiredCredentials.map((cred) => (
                <div key={cred.key}>
                  <label className="text-sm font-medium text-[#F1F5F9]">
                    {cred.label}
                    {cred.required && <span className="text-red-400">*</span>}
                  </label>
                  <Input
                    type={cred.type}
                    value={formData[cred.key] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [cred.key]: e.target.value })
                    }
                    placeholder={cred.placeholder}
                    className="bg-[#0E0F12] border-[#2A2D38] mt-1"
                  />
                </div>
              ))}

              {selectedProvider.optionalSettings &&
                selectedProvider.optionalSettings.length > 0 && (
                  <div className="pt-4 border-t border-[#2A2D38]">
                    <h4 className="text-sm font-medium text-[#64748B] mb-3">
                      Optional Settings
                    </h4>
                    {selectedProvider.optionalSettings.map((setting) => (
                      <div key={setting.key} className="mb-3">
                        <label className="text-sm font-medium text-[#F1F5F9]">
                          {setting.label}
                        </label>
                        <Input
                          value={formData[setting.key] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [setting.key]: e.target.value,
                            })
                          }
                          placeholder={setting.placeholder}
                          className="bg-[#0E0F12] border-[#2A2D38] mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Lock className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-yellow-400">
                  Your credentials are encrypted and stored securely.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A2D38]"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setSelectedProvider(null);
                    setFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                  onClick={handleCreateIntegration}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Integration'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
