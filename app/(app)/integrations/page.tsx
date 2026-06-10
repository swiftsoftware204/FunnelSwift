'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plug,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  product: string;
  webhook_url: string;
  is_active: boolean;
  last_called_at: string | null;
}

interface WorkflowTrigger {
  id: string;
  name: string;
  description: string;
  source: string;
  event_type: string;
  is_active: boolean;
}

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTrigger[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Load webhook configs
    const { data: webhookData } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('product');

    if (webhookData) setWebhooks(webhookData);

    // Load workflow triggers
    const { data: workflowData } = await supabase
      .from('workflow_triggers')
      .select('*')
      .order('name');

    if (workflowData) setWorkflows(workflowData);

    // Load recent events
    const { data: eventData } = await supabase
      .from('integration_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventData) setEvents(eventData);

    setLoading(false);
  }

  async function toggleWebhook(id: string, currentStatus: boolean) {
    await supabase
      .from('webhook_configs')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    loadData();
  }

  async function toggleWorkflow(id: string, currentStatus: boolean) {
    await supabase
      .from('workflow_triggers')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    loadData();
  }

  const productIcons: Record<string, string> = {
    adaswift: '🎯',
    missedcall: '📞',
    workflowswift: '⚡',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Integrations</h1>
          <p className="text-[#64748B] mt-1">
            Connect FunnelSwift with other SwiftSoftware products
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#2A2D38] text-[#F1F5F9]"
          onClick={loadData}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connected Products */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Plug className="h-5 w-5 text-[#5B4FFF]" />
            Connected Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {productIcons[webhook.product] || '🔌'}
                  </div>
                  <div>
                    <h3 className="font-medium text-[#F1F5F9] capitalize">
                      {webhook.product.replace(/-/g, ' ')}
                    </h3>
                    <p className="text-sm text-[#64748B]">{webhook.webhook_url}</p>
                    {webhook.last_called_at && (
                      <p className="text-xs text-[#64748B] mt-1">
                        Last called: {new Date(webhook.last_called_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={webhook.is_active ? 'default' : 'secondary'}
                    className={
                      webhook.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {webhook.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={() => toggleWebhook(webhook.id, webhook.is_active)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Triggers */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#F59E0B]" />
            Automation Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#F1F5F9]">{workflow.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {workflow.event_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#64748B] mt-1">
                    {workflow.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={workflow.is_active ? 'default' : 'secondary'}
                    className={
                      workflow.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {workflow.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={() => toggleWorkflow(workflow.id, workflow.is_active)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#8B5CF6]" />
            Recent Integration Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-[#64748B] text-center py-8">No events yet</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0E0F12] text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.source}
                    </Badge>
                    <span className="text-[#F1F5F9]">{event.event_type}</span>
                  </div>
                  <span className="text-[#64748B] text-xs">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="border-[#2A2D38] text-[#F1F5F9] h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => {
                // Test ADA workflow
                console.log('Test ADA workflow');
              }}
            >
              <span className="text-2xl">🎯</span>
              <span>Test ADA Delivery</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-[#2A2D38] text-[#F1F5F9] h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => {
                // Test Missed Call workflow
                console.log('Test Missed Call workflow');
              }}
            >
              <span className="text-2xl">📞</span>
              <span>Test Missed Call</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-[#2A2D38] text-[#F1F5F9] h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => {
                // View logs
                console.log('View logs');
              }}
            >
              <span className="text-2xl">📊</span>
              <span>View Integration Logs</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
