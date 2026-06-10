'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ApiKey } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from 'lucide-react';

const availablePermissions = [
  { id: 'leads:read', label: 'Read Leads' },
  { id: 'leads:write', label: 'Create/Update Leads' },
  { id: 'events:read', label: 'Read Events' },
  { id: 'events:write', label: 'Create Events' },
  { id: 'tags:read', label: 'Read Tags' },
  { id: 'tags:write', label: 'Create Tags' },
];

const appOptions = [
  'ada_widget',
  'ai_agent',
  'command_center',
  'mobile_app',
  'n8n',
  'other',
];

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyApp, setNewKeyApp] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setApiKeys(data || []);
    setLoading(false);
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (newKeyPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      // Generate a random API key
      const keyValue = 'sk_live_' + crypto.randomUUID().replace(/-/g, '');

      // Hash the key (in a real implementation, this would be done server-side)
      // For now, we'll store it as-is for demo purposes

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName,
          key_hash: keyValue, // In production, this would be a bcrypt hash
          app_name: newKeyApp || null,
          permissions: newKeyPermissions,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedKey(keyValue);
      setApiKeys([data, ...apiKeys]);
      toast.success('API key created');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    await supabase.from('api_keys').delete().eq('id', id);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast.success('API key deleted');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">API Keys</h1>
          <p className="text-[#64748B] mt-1">Manage API keys for inter-app authentication</p>
        </div>
        <Button
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="bg-[#F59E0B]/10 border-[#F59E0B]/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#F1F5F9] font-medium">Security Notice</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              API keys are only shown once when created. Store them securely. Keys with sensitive
              permissions should be rotated regularly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Active Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-[#2A2D38] rounded-lg mb-4" />
            ))
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-[#64748B]">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No API keys yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#5B4FFF]/20 flex items-center justify-center">
                      <Key className="h-5 w-5 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#F1F5F9]">{key.name}</p>
                        {key.is_active ? (
                          <Badge className="bg-[#22C55E]/20 text-[#22C55E]">Active</Badge>
                        ) : (
                          <Badge className="bg-[#EF4444]/20 text-[#EF4444]">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-[#64748B]">
                        {key.app_name && <span>{key.app_name}</span>}
                        <span>
                          Last used: {key.last_used ? formatRelativeTime(key.last_used) : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs border-[#2A2D38] text-[#94A3B8]">
                          {perm.split(':')[1]}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteKey(key.id)}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] text-[#F1F5F9] max-w-lg">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Generate a new API key for authenticating with the Lead Capture API
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Key Name *</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., ADA Widget Key"
                className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">App Name</label>
              <Select value={newKeyApp} onValueChange={setNewKeyApp}>
                <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]">
                  <SelectValue placeholder="Select app (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                  {appOptions.map((app) => (
                    <SelectItem key={app} value={app}>
                      {app.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Permissions *</label>
              <div className="flex flex-wrap gap-2">
                {availablePermissions.map((perm) => (
                  <Badge
                    key={perm.id}
                    variant={newKeyPermissions.includes(perm.id) ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      newKeyPermissions.includes(perm.id)
                        ? 'bg-[#5B4FFF] text-white'
                        : 'border-[#2A2D38] text-[#94A3B8]'
                    }`}
                    onClick={() => {
                      if (newKeyPermissions.includes(perm.id)) {
                        setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm.id));
                      } else {
                        setNewKeyPermissions([...newKeyPermissions, perm.id]);
                      }
                    }}
                  >
                    {perm.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="flex-1 border-[#2A2D38] text-[#F1F5F9]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleCreateKey();
              }}
              className="flex-1 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
            >
              Generate Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] text-[#F1F5F9]">
          <DialogHeader>
            <DialogTitle className="text-[#22C55E] flex items-center gap-2">
              <Check className="h-5 w-5" />
              API Key Created
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Store this key securely. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 p-4 bg-[#0E0F12] rounded-lg border border-[#2A2D38]">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-[#F1F5F9] font-mono break-all">
                {showKey ? generatedKey : '•'.repeat(40)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="text-[#64748B]"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(generatedKey!)}
                className="text-[#64748B]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full mt-4 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
            onClick={() => {
              setGeneratedKey(null);
              setShowKey(false);
              setCreateDialogOpen(false);
              setNewKeyName('');
              setNewKeyApp('');
              setNewKeyPermissions([]);
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
