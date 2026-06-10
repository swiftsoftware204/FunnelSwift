'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Plus, Check, X, Trash2, Copy, ExternalLink } from 'lucide-react';

export default function TenantDomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  }

  async function addDomain() {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      toast.error('Invalid domain format. Use: go.yourdomain.com');
      return;
    }

    try {
      const { error } = await supabase.from('tenant_domains').insert({
        domain: newDomain.trim().toLowerCase(),
        is_verified: false,
        verification_status: 'pending',
        ssl_status: 'pending',
      });

      if (error) throw error;

      toast.success('Domain added! Now add the DNS record below.');
      setNewDomain('');
      loadDomains();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add domain');
    }
  }

  async function verifyDomain(domainId: string) {
    setVerifying(domainId);
    try {
      // In production, this would check DNS records
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('tenant_domains')
        .update({
          is_verified: true,
          verification_status: 'verified',
          ssl_status: 'active',
        })
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Domain verified and SSL activated!');
      loadDomains();
    } catch (error) {
      toast.error('Verification failed. Check DNS settings.');
    } finally {
      setVerifying(null);
    }
  }

  async function deleteDomain(domainId: string) {
    if (!confirm('Delete this domain? Campaigns using it will break.')) return;

    try {
      const { error } = await supabase
        .from('tenant_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Domain deleted');
      loadDomains();
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  }

  function copyDNSInstructions(domain: string) {
    const instructions = `Type: CNAME
Name: ${domain.split('.')[0]}
Value: funnelswift.netlify.app
TTL: 3600`;
    navigator.clipboard.writeText(instructions);
    toast.success('DNS instructions copied!');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Custom Domains</h1>
        <p className="text-[#94A3B8] mt-1">
          Use your own domains for campaigns
        </p>
      </div>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#5B4FFF]" />
            Add Domain or Subdomain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="go.yourdomain.com or campaigns.yoursite.com"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <Button onClick={addDomain} className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            Examples: go.mybusiness.com, offers.company.com, promo.mysite.co
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">My Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-[#64748B] py-4">Loading...</p>
          ) : domains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-[#94A3B8]">No custom domains yet</p>
              <p className="text-sm text-[#64748B] mt-1">
                Add your first domain above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="p-4 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-[#5B4FFF]" />
                      <div>
                        <p className="font-medium text-[#F1F5F9]">{domain.domain}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {domain.is_verified ? (
                            <Badge className="bg-green-500/20 text-green-400">
                              <Check className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400">
                              <X className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {domain.ssl_status === 'active' && (
                            <Badge className="bg-blue-500/20 text-blue-400">SSL Active</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!domain.is_verified && (
                        <Button
                          size="sm"
                          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                          onClick={() => verifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                        >
                          {verifying === domain.id ? 'Verifying...' : 'Verify'}
                        </Button>
                      )}
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

                  {!domain.is_verified && (
                    <div className="bg-[#16181D] p-3 rounded border border-[#2A2D38]">
                      <p className="text-sm text-[#94A3B8] mb-2">
                        Add this DNS record to verify:
                      </p>
                      <code className="block bg-[#0E0F12] p-2 rounded text-xs text-[#F1F5F9] font-mono">
                        Type: CNAME<br />
                        Name: {domain.domain.split('.')[0]}<br />
                        Value: funnelswift.netlify.app<br />
                        TTL: 3600
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-[#2A2D38]"
                        onClick={() => copyDNSInstructions(domain.domain)}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy Instructions
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardContent className="p-4">
          <h3 className="font-medium text-[#F1F5F9] mb-2">How It Works</h3>
          <ol className="text-sm text-[#94A3B8] space-y-2 list-decimal list-inside">
            <li>Add your domain or subdomain above</li>
            <li>Add the DNS CNAME record in your domain provider</li>
            <li>Click "Verify" - we'll check the DNS</li>
            <li>SSL certificate auto-provisions</li>
            <li>Use your domain in campaigns!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
