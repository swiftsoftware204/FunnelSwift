'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  Search, 
  Plus,
  ExternalLink,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  owner_id?: string;
  container_status?: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tenants.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants(tenants);
    }
  }, [searchQuery, tenants]);

  async function loadTenants() {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
      setFilteredTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTenantStatus(tenantId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !currentStatus })
        .eq('id', tenantId);

      if (error) throw error;
      
      toast.success(`Tenant ${currentStatus ? 'deactivated' : 'activated'}`);
      loadTenants();
    } catch (error) {
      toast.error('Failed to update tenant');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading tenants...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Tenants</h1>
          <p className="text-[#64748B]">Manage all tenant accounts</p>
        </div>
        <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              placeholder="Search tenants by name or subdomain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#5B4FFF]" />
            All Tenants ({filteredTenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTenants.map((tenant) => (
              <div 
                key={tenant.id}
                className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg border border-[#2A2D38] hover:border-[#5B4FFF]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#5B4FFF]/20 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[#5B4FFF]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F1F5F9]">{tenant.name}</p>
                    <p className="text-sm text-[#64748B]">{tenant.subdomain}.funnelswift.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className="bg-[#5B4FFF]/20 text-[#5B4FFF]">
                      {tenant.plan}
                    </Badge>
                    <p className="text-xs text-[#64748B] mt-1">
                      Created {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge 
                    variant={tenant.is_active ? 'default' : 'secondary'}
                    className={tenant.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                  >
                    {tenant.is_active ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                    )}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#64748B]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#16181D] border-[#2A2D38]">
                      <DropdownMenuItem 
                        className="text-[#F1F5F9] focus:bg-[#2A2D38] cursor-pointer"
                        onClick={() => window.open(`https://${tenant.subdomain}.funnelswift.com`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-[#F1F5F9] focus:bg-[#2A2D38] cursor-pointer"
                        onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}
                      >
                        {tenant.is_active ? (
                          <><XCircle className="h-4 w-4 mr-2" /> Deactivate</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredTenants.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-[#2A2D38] mx-auto mb-4" />
                <p className="text-[#64748B]">No tenants found</p>
                {searchQuery && (
                  <p className="text-sm text-[#64748B] mt-1">
                    Try adjusting your search
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
