'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLeadsStore } from '@/stores/leads.store';
import { useLeads } from '@/hooks/useLeads';
import { formatRelativeTime, getSourceLabel, cn } from '@/lib/utils';
import { getLeadTier, getTierColor } from '@/lib/scoring/lead-score';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function LeadsPage() {
  const { leads, tags, isLoading } = useLeadsStore();
  const { fetchLeads } = useLeads();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.business_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Leads</h1>
          <p className="text-[#64748B] mt-1">All captured contacts in your database</p>
        </div>
        <Link href="/capture">
          <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="form">Web Form</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="demo_ada">ADA Demo</SelectItem>
                <SelectItem value="demo_ai">AI Agent</SelectItem>
                <SelectItem value="demo_missed_call">Missed Call</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-[#64748B]">
            <span>{filteredLeads.length} leads found</span>
            <Button variant="ghost" size="sm" className="text-[#64748B]">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="bg-[#16181D] border-[#2A2D38] animate-pulse">
              <CardContent className="p-4 h-20" />
            </Card>
          ))
        ) : filteredLeads.length === 0 ? (
          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-8 text-center">
              <p className="text-[#64748B]">No leads found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const tier = getLeadTier(lead.lead_score);
            const contactTags = (lead as any).contact_tags || [];
            const leadTags = tags.filter((tag) =>
              contactTags.some((ct: any) => ct.tags?.id === tag.id)
            );

            return (
              <Link key={lead.id} href={`/leads/${lead.id}`}>
                <Card className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] flex items-center justify-center text-white text-lg font-medium shrink-0">
                        {lead.first_name?.[0] || lead.email?.[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-[#F1F5F9]">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: getTierColor(tier), color: getTierColor(tier) }}
                          >
                            {tier}
                          </Badge>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A2D38] text-[#94A3B8] capitalize">
                            {lead.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-[#64748B]">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.business_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {lead.business_name}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {leadTags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {leadTags.slice(0, 4).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {leadTags.length > 4 && (
                              <span className="text-xs text-[#64748B]">
                                +{leadTags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <span>{getSourceLabel(lead.source)}</span>
                          <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                          <span>{formatRelativeTime(lead.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[#0E0F12] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                tier === 'hot' ? 'bg-[#EF4444]' : tier === 'warm' ? 'bg-[#F59E0B]' : 'bg-[#94A3B8]'
                              )}
                              style={{ width: `${lead.lead_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-[#F1F5F9]">
                            {lead.lead_score}
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#64748B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
