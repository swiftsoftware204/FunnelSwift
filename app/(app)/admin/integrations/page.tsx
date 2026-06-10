'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, Globe, Check, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminIntegrationsPage() {
  const [myIntegrations, setMyIntegrations] = useState<any[]>([]);
  const [allIntegrations, setAllIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setIsLoading(true);
    try {
      // Load my personal integrations (as tenant)
      const { data: myData } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', 'my-personal-tenant-id') // Super Admin's personal tenant
        .order('created_at', { ascending: false });

      setMyIntegrations(myData || []);

      // Load all integrations (as Super Admin)
      const { data: allData } = await supabase
        .from('tenant_integrations')
        .select('*, tenant:tenant_id(name)')
        .order('created_at', { ascending: false });

      setAllIntegrations(allData || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyIntegration(integrationId: string) {
    toast.info('Verifying...');
    // Implementation would call the verification API
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Integrations</h1>
        <Link href="/settings/integrations">
          <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
            <Settings className="h-4 w-4 mr-2" />
            My Integrations
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="bg-[#0E0F12] border border-[#2A2D38]">
          <TabsTrigger value="my" className="data-[state=active]:bg-[#5B4FFF]">
            My Integrations
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-[#5B4FFF]">
            All Tenant Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4">
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#5B4FFF]" />
                My Personal Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myIntegrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#64748B] mb-4">You haven't set up any integrations yet.</p>
                  <Link href="/settings/integrations">
                    <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
                      Add Integration
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myIntegrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.provider_id === 'sendiio' ? '📧' : '🔌'}</div>
                        <div>
                          <h3 className="font-medium text-[#F1F5F9]">{integration.name}</h3>
                          <p className="text-sm text-[#64748B]">{integration.provider_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={integration.is_active ? 'default' : 'secondary'} className={integration.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {integration.is_active ? <><Check className="h-3 w-3 mr-1" /> Active</> : <><X className="h-3 w-3 mr-1" /> Inactive</>}
                        </Badge>
                        <Button variant="outline" size="sm" className="border-[#2A2D38]" onClick={() => verifyIntegration(integration.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#5B4FFF]" />
                All Tenant Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allIntegrations.length === 0 ? (
                <p className="text-center text-[#64748B] py-4">No integrations found</p>
              ) : (
                <div className="space-y-2">
                  {allIntegrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#F1F5F9]">{integration.name}</p>
                          <span className="text-sm text-[#64748B]">({integration.tenant?.name || 'Unknown'})</span>
                        </div>
                        <p className="text-sm text-[#64748B]">{integration.provider_id}</p>
                      </div>
                      <Badge variant={integration.is_active ? 'default' : 'secondary'} className={integration.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
