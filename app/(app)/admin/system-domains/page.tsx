'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Plus, Check, X, Star, Trash2 } from 'lucide-react';

export default function SystemDomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_domains')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load system domains');
    } finally {
      setIsLoading(false);
    }
  }

  async function addDomain() {
    if (!newDomain.trim() || !newDisplayName.trim()) {
      toast.error('Please enter domain and display name');
      return;
    }

    try {
      const { error } = await supabase.from('system_domains').insert({
        domain: newDomain.trim(),
        display_name: newDisplayName.trim(),
        description: '',
        is_active: true,
        is_default: domains.length === 0, // First one is default
      });

      if (error) throw error;

      toast.success('Domain added successfully');
      setNewDomain('');
      setNewDisplayName('');
      loadDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add domain');
    }
  }

  async function toggleDefault(domainId: string) {
    try {
      // Remove default from all
      await supabase
        .from('system_domains')
        .update({ is_default: false })
        .neq('id', domainId);

      // Set new default
      await supabase
        .from('system_domains')
        .update({ is_default: true })
        .eq('id', domainId);

      toast.success('Default domain updated');
      loadDomains();
    } catch (error) {
      toast.error('Failed to update default');
    }
  }

  async function toggleActive(domainId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('system_domains')
        .update({ is_active: !currentStatus })
        .eq('id', domainId);

      if (error) throw error;

      toast.success(currentStatus ? 'Domain deactivated' : 'Domain activated');
      loadDomains();
    } catch (error) {
      toast.error('Failed to update domain');
    }
  }

  async function deleteDomain(domainId: string) {
    if (!confirm('Are you sure? This will break any campaigns using this domain.')) return;

    try {
      const { error } = await supabase
        .from('system_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Domain deleted');
      loadDomains();
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">System Domains</h1>
      </div>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#5B4FFF]" />
            Add New System Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-[#64748B] mb-1 block">Domain</label>
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="go.funnelswift.com"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-[#64748B] mb-1 block">Display Name</label>
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Go Links"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDomain} className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            After adding, configure DNS: CNAME {newDomain || 'domain'} → funnelswift.netlify.app
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Active System Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-[#64748B] py-4">Loading...</p>
          ) : domains.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No system domains configured</p>
          ) : (
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-[#5B4FFF]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#F1F5F9]">{domain.domain}</p>
                        {domain.is_default && (
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {domain.display_name} • {domain.total_campaigns} campaigns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!domain.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2A2D38]"
                        onClick={() => toggleDefault(domain.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={domain.is_active ? 'border-green-500/30 text-green-400' : 'border-gray-500/30 text-gray-400'}
                      onClick={() => toggleActive(domain.id, domain.is_active)}
                    >
                      {domain.is_active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteDomain(domain.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardContent className="p-4">
          <h3 className="font-medium text-[#F1F5F9] mb-2">DNS Configuration</h3>
          <p className="text-sm text-[#94A3B8] mb-2">
            For each domain above, add this DNS record:
          </p>
          <code className="block bg-[#16181D] p-3 rounded text-sm text-[#F1F5F9]">
            Type: CNAME<br/>
            Name: [subdomain]<br/>
            Value: funnelswift.netlify.app
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
