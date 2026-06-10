'use client';

import { useLeadsStore } from '@/stores/leads.store';
import { useLeads } from '@/hooks/useLeads';
import { formatRelativeTime, getSourceLabel } from '@/lib/utils';
import { getLeadTier, getTierColor } from '@/lib/scoring/lead-score';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Flame,
  TrendingUp,
  FormInput,
  MessageSquare,
  Eye,
  Bot,
  Phone,
} from 'lucide-react';

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  form: FormInput,
  sms: MessageSquare,
  demo_ada: Eye,
  demo_ai: Bot,
  demo_missed_call: Phone,
};

export default function DashboardPage() {
  const { leads, pipelines, tags } = useLeadsStore();

  // Calculate stats
  const totalLeads = leads.length;
  const newLeadsToday = leads.filter((lead) => {
    const today = new Date();
    const leadDate = new Date(lead.created_at);
    return leadDate.toDateString() === today.toDateString();
  }).length;
  const hotLeads = leads.filter((lead) => getLeadTier(lead.lead_score) === 'hot').length;
  const qualifiedLeads = leads.filter((lead) => lead.status === 'qualified').length;

  const leadsBySource = leads.reduce((acc, lead) => {
    const source = lead.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: 'Total Leads',
      value: totalLeads,
      icon: Users,
      color: 'from-[#5B4FFF] to-[#8B5CF6]',
      change: '+12%',
    },
    {
      title: 'New Today',
      value: newLeadsToday,
      icon: UserPlus,
      color: 'from-[#3B82F6] to-[#06B6D4]',
      change: '+5',
    },
    {
      title: 'Hot Leads',
      value: hotLeads,
      icon: Flame,
      color: 'from-[#EF4444] to-[#F97316]',
      change: '+3',
    },
    {
      title: 'Qualified',
      value: qualifiedLeads,
      icon: TrendingUp,
      color: 'from-[#22C55E] to-[#10B981]',
      change: '+8%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Dashboard</h1>
          <p className="text-[#64748B] mt-1">Monitor your lead capture in real-time</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-[#16181D] border-[#2A2D38]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748B]">{stat.title}</p>
                  <p className="text-3xl font-bold text-[#F1F5F9] mt-1">{stat.value}</p>
                  <p className="text-xs text-[#22C55E] mt-1">{stat.change} this week</p>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    stat.color
                  )}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9]">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(leadsBySource).map(([source, count]) => {
                const Icon = sourceIcons[source] || Users;
                const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={source} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2A2D38] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#64748B]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#F1F5F9]">{getSourceLabel(source)}</span>
                        <span className="text-sm text-[#64748B]">{count}</span>
                      </div>
                      <div className="h-2 bg-[#0E0F12] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5B4FFF] to-[#8B5CF6] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9]">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => {
                const tier = getLeadTier(lead.lead_score);
                return (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0E0F12] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-medium">
                      {lead.first_name?.[0] || lead.email?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F1F5F9] truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">
                        {lead.email || lead.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: getTierColor(tier), color: getTierColor(tier) }}
                      >
                        {tier}
                      </Badge>
                      <span className="text-xs text-[#64748B]">{formatRelativeTime(lead.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Pipelines */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Active Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="p-4 rounded-xl bg-[#0E0F12] border border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-[#F1F5F9]">{pipeline.name}</p>
                <p className="text-2xl font-bold text-[#5B4FFF] mt-2">--</p>
                <p className="text-xs text-[#64748B]">in pipeline</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
