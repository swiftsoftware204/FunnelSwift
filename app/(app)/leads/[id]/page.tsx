'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Contact, Event, Tag, Pipeline, PipelineStage } from '@/types';
import { formatRelativeTime, getSourceLabel, formatPhone, cn } from '@/lib/utils';
import { getLeadTier, getTierColor, getTierLabel } from '@/lib/scoring/lead-score';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  Tag as TagIcon,
  Edit2,
  Trash2,
  MessageSquare,
  User,
  Clock,
  Flame,
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<(Contact & { tags: Tag[]; lead_tags?: any[] }) | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [pipelinePosition, setPipelinePosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchLead() {
      setLoading(true);

      // Fetch lead with tags
      const { data: contact } = await supabase
        .from('contacts')
        .select('*, contact_tags(tags(id, name, color))')
        .eq('id', leadId)
        .single();

      if (contact) {
        const tags = contact.contact_tags?.map((ct: any) => ct.tags) || [];
        setLead({ ...contact, tags });
        setNote(contact.notes || '');
      }

      // Fetch events
      const { data: leadEvents } = await supabase
        .from('events')
        .select('*')
        .eq('contact_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50);
      setEvents(leadEvents || []);

      // Fetch pipelines
      const { data: allPipelines } = await supabase
        .from('pipelines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setPipelines(allPipelines || []);

      // Fetch stages
      const { data: allStages } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order');
      setStages(allStages || []);

      // Fetch pipeline position
      const { data: position } = await supabase
        .from('pipeline_contacts')
        .select('*, pipelines(name), pipeline_stages(name, color)')
        .eq('contact_id', leadId)
        .maybeSingle();
      setPipelinePosition(position);

      setLoading(false);
    }

    fetchLead();
  }, [leadId]);

  const handleSaveNote = async () => {
    if (!lead) return;
    await supabase
      .from('contacts')
      .update({ notes: note, updated_at: new Date().toISOString() })
      .eq('id', lead.id);
    setLead({ ...lead, notes: note });
  };

  const tier = lead ? getLeadTier(lead.lead_score) : 'cold';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-[#2A2D38] rounded mb-4" />
          <div className="h-64 bg-[#16181D] rounded-xl border border-[#2A2D38]" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748B]">Lead not found</p>
        <Button onClick={() => router.push('/leads')} className="mt-4">
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/leads')}
          className="text-[#64748B] hover:text-[#F1F5F9]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#F1F5F9]">
              {lead.first_name} {lead.last_name}
            </h1>
            <Badge
              variant="outline"
              className="text-sm"
              style={{ borderColor: getTierColor(tier), color: getTierColor(tier) }}
            >
              {getTierLabel(tier)}
            </Badge>
          </div>
          <p className="text-[#64748B] mt-1">{getSourceLabel(lead.source)} • {formatRelativeTime(lead.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-[#2A2D38] text-[#F1F5F9]">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" className="bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2A2D38] flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-[#F1F5F9] hover:text-[#5B4FFF]">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2A2D38] flex items-center justify-center">
                      <Phone className="h-5 w-5 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Phone</p>
                      <a href={`tel:${lead.phone}`} className="text-[#F1F5F9] hover:text-[#5B4FFF]">
                        {formatPhone(lead.phone)}
                      </a>
                    </div>
                  </div>
                )}
                {lead.business_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2A2D38] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Business</p>
                      <p className="text-[#F1F5F9]">{lead.business_name}</p>
                    </div>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2A2D38] flex items-center justify-center">
                      <Globe className="h-5 w-5 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Website</p>
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-[#F1F5F9] hover:text-[#5B4FFF]">
                        {lead.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9]">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#5B4FFF] shrink-0" />
                      <div className="flex-1 pb-4 border-b border-[#2A2D38] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#F1F5F9] capitalize">
                            {event.event_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            {event.source_app}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1">
                          {formatRelativeTime(event.created_at)}
                        </p>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <pre className="mt-2 p-2 bg-[#0E0F12] rounded text-xs text-[#94A3B8] overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9]">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this lead..."
                className="min-h-[120px] bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
              <Button
                onClick={handleSaveNote}
                className="mt-3 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Score */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="h-5 w-5 text-[#EF4444]" />
                <h3 className="font-medium text-[#F1F5F9]">Lead Score</h3>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    'text-6xl font-bold',
                    tier === 'hot' ? 'text-[#EF4444]' : tier === 'warm' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                  )}
                >
                  {lead.lead_score}
                </div>
                <div className="w-full h-3 bg-[#0E0F12] rounded-full overflow-hidden mt-4">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      tier === 'hot' ? 'bg-[#EF4444]' : tier === 'warm' ? 'bg-[#F59E0B]' : 'bg-[#94A3B8]'
                    )}
                    style={{ width: `${lead.lead_score}%` }}
                  />
                </div>
                <p className="text-sm text-[#64748B] mt-2">{getTierLabel(tier)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#F1F5F9] flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  Tags
                </h3>
                <Button variant="ghost" size="sm" className="text-[#5B4FFF]">
                  + Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    className="text-sm"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {lead.tags.length === 0 && (
                  <p className="text-sm text-[#64748B]">No tags</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Position */}
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#F1F5F9]">Pipeline</h3>
                <Button variant="ghost" size="sm" className="text-[#5B4FFF]">
                  Move
                </Button>
              </div>
              {pipelinePosition ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#64748B]">{(pipelinePosition.pipelines as any)?.name}</p>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: `${(pipelinePosition.pipeline_stages as any)?.color}20`,
                      color: (pipelinePosition.pipeline_stages as any)?.color,
                    }}
                  >
                    {(pipelinePosition.pipeline_stages as any)?.name}
                  </div>
                  {pipelinePosition.deal_value && (
                    <p className="text-lg font-bold text-[#22C55E] mt-2">
                      ${pipelinePosition.deal_value.toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#64748B]">Not in any pipeline</p>
              )}
            </CardContent>
          </Card>

          {/* AI Message */}
          <Card className="bg-gradient-to-br from-[#5B4FFF]/10 to-[#8B5CF6]/10 border-[#5B4FFF]/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-[#5B4FFF]" />
                <h3 className="font-medium text-[#F1F5F9]">AI Prospecting Message</h3>
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Hi {lead.first_name || 'there'}, I noticed you&apos;re interested in {lead.industry || 'improving your business'}. Let&apos;s schedule a quick call to discuss how we can help you achieve your goals.
              </p>
              <Button className="w-full mt-4 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
                Copy Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
