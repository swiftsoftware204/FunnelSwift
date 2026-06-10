'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WebhookConfig } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Webhook,
  Plus,
  Trash2,
  Pencil,
  Globe,
  Play,
  Pause,
} from 'lucide-react';

const eventTypes = [
  'lead_created',
  'lead_updated',
  'form_submitted',
  'sms_received',
  'demo_viewed',
  'tag_applied',
  'stage_changed',
  'score_updated',
  'hot_lead_alert',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookConfig | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formEventTypes, setFormEventTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setWebhooks(data || []);
    setLoading(false);
  }

  const handleSubmit = async () => {
    if (!formName.trim() || !formUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    if (formEventTypes.length === 0) {
      toast.error('Select at least one event type');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editWebhook) {
        const { error } = await supabase
          .from('webhook_configs')
          .update({
            name: formName,
            url: formUrl,
            secret: formSecret || null,
            event_types: formEventTypes,
          })
          .eq('id', editWebhook.id);
        if (error) throw error;
        toast.success('Webhook updated');
      } else {
        const { error } = await supabase.from('webhook_configs').insert({
          name: formName,
          url: formUrl,
          secret: formSecret || null,
          event_types: formEventTypes,
          is_active: true,
        });
        if (error) throw error;
        toast.success('Webhook created');
      }
      fetchWebhooks();
      closeDialog();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    await supabase.from('webhook_configs').delete().eq('id', id);
    setWebhooks(webhooks.filter((w) => w.id !== id));
    toast.success('Webhook deleted');
  };

  const handleToggleActive = async (webhook: WebhookConfig) => {
    const { error } = await supabase
      .from('webhook_configs')
      .update({ is_active: !webhook.is_active })
      .eq('id', webhook.id);
    if (error) {
      toast.error('Failed to update webhook');
      return;
    }
    setWebhooks(
      webhooks.map((w) =>
        w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
      )
    );
    toast.success(webhook.is_active ? 'Webhook paused' : 'Webhook activated');
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditWebhook(webhook);
    setFormName(webhook.name);
    setFormUrl(webhook.url);
    setFormSecret(webhook.secret || '');
    setFormEventTypes(webhook.event_types);
    setCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setCreateDialogOpen(false);
    setEditWebhook(null);
    setFormName('');
    setFormUrl('');
    setFormSecret('');
    setFormEventTypes([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Webhooks</h1>
          <p className="text-[#64748B] mt-1">
            Configure outbound webhooks for events
          </p>
        </div>
        <Button
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Configured Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-24 bg-[#2A2D38] rounded-lg mb-4" />
            ))
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-[#64748B]">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No webhooks configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        webhook.is_active
                          ? 'bg-[#22C55E]/20'
                          : 'bg-[#64748B]/20'
                      }`}
                    >
                      <Webhook
                        className={`h-5 w-5 ${
                          webhook.is_active ? 'text-[#22C55E]' : 'text-[#64748B]'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#F1F5F9]">{webhook.name}</p>
                        {webhook.is_active ? (
                          <Badge className="bg-[#22C55E]/20 text-[#22C55E]">Active</Badge>
                        ) : (
                          <Badge className="bg-[#64748B]/20 text-[#64748B]">Paused</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-[#64748B]">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="truncate max-w-md">{webhook.url}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.event_types.map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs border-[#2A2D38] text-[#94A3B8]"
                          >
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(webhook)}
                      className={webhook.is_active ? 'text-[#F59E0B]' : 'text-[#22C55E]'}
                    >
                      {webhook.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(webhook)}
                      className="text-[#64748B]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(webhook.id)}
                      className="text-[#EF4444] hover:bg-[#EF4444]/10"
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

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] text-[#F1F5F9] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Configure an outbound webhook endpoint
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., n8n Lead Handler"
                className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">URL *</label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://your-webhook-url.com/endpoint"
                className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Secret (for HMAC signing)</label>
              <Input
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                placeholder="Optional secret for signature verification"
                className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">
                Event Types * (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={formEventTypes.includes(type) ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      formEventTypes.includes(type)
                        ? 'bg-[#5B4FFF] text-white'
                        : 'border-[#2A2D38] text-[#94A3B8]'
                    }`}
                    onClick={() => {
                      if (formEventTypes.includes(type)) {
                        setFormEventTypes(formEventTypes.filter((t) => t !== type));
                      } else {
                        setFormEventTypes([...formEventTypes, type]);
                      }
                    }}
                  >
                    {type.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="flex-1 border-[#2A2D38] text-[#F1F5F9]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
            >
              {isSubmitting ? 'Saving...' : editWebhook ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
