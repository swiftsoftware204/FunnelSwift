'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Send, Filter, CheckSquare } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tags: string[];
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  integration: string; // 'sendiio', 'globalcontrol', etc.
}

export default function CampaignAssignmentPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadLeads();
    loadCampaigns();
  }, []);

  async function loadLeads() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, tags, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCampaigns() {
    // Load from tenant_integrations (Sendiio, Global Control, etc.)
    try {
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('id, name, provider_id')
        .eq('is_active', true)
        .in('provider_id', ['sendiio', 'globalcontrol', 'mailchimp', 'activecampaign']);

      if (error) throw error;

      const formattedCampaigns: Campaign[] = (data || []).map(int => ({
        id: int.id,
        name: int.name,
        integration: int.provider_id,
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  }

  function toggleLeadSelection(leadId: string) {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }

  function selectAllVisible() {
    const visibleLeadIds = filteredLeads.map(l => l.id);
    const allSelected = visibleLeadIds.every(id => selectedLeads.includes(id));
    
    if (allSelected) {
      setSelectedLeads(prev => prev.filter(id => !visibleLeadIds.includes(id)));
    } else {
      setSelectedLeads(prev => [...new Set([...prev, ...visibleLeadIds])]);
    }
  }

  async function assignToCampaign() {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    if (!selectedCampaign) {
      toast.error('Please select a campaign');
      return;
    }

    setIsSending(true);
    try {
      // Get selected leads data
      const leadsToSend = leads.filter(l => selectedLeads.includes(l.id));
      
      // Get campaign integration details
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      
      // Send to integration via webhook/API
      const { error } = await supabase.functions.invoke('assign-to-campaign', {
        body: {
          leads: leadsToSend,
          campaign_id: selectedCampaign,
          integration: campaign?.integration,
        },
      });

      if (error) throw error;

      toast.success(`${selectedLeads.length} leads assigned to campaign!`);
      setSelectedLeads([]);
      setSelectedCampaign('');
    } catch (error) {
      toast.error('Failed to assign leads');
    } finally {
      setIsSending(false);
    }
  }

  // Get unique tags from all leads
  const allTags = [...new Set(leads.flatMap(l => l.tags || []))];
  
  // Filter leads by tag
  const filteredLeads = filterTag 
    ? leads.filter(l => l.tags?.includes(filterTag))
    : leads;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Assign to Campaign</h1>
      </div>

      {/* Filters */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-5 w-5 text-[#5B4FFF]" />
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[200px] bg-[#0E0F12] border-[#2A2D38]">
                <SelectValue placeholder="Filter by tag..." />
              </SelectTrigger>
              <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                <SelectItem value="">All leads</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterTag && (
              <Button variant="ghost" size="sm" onClick={() => setFilterTag('')}>
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Selection */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Send className="h-5 w-5 text-[#5B4FFF]" />
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[300px] bg-[#0E0F12] border-[#2A2D38]">
                <SelectValue placeholder="Select campaign/integration..." />
              </SelectTrigger>
              <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.integration})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              onClick={assignToCampaign}
              disabled={isSending || selectedLeads.length === 0 || !selectedCampaign}
            >
              {isSending ? 'Sending...' : `Assign ${selectedLeads.length} Leads`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#5B4FFF]" />
            Leads ({filteredLeads.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Select All Visible
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-[#64748B] py-4">Loading...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No leads found</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 bg-[#0E0F12] rounded-lg hover:bg-[#1a1c23]"
                >
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-[#F1F5F9]">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-sm text-[#64748B]">{lead.email}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
