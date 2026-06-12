'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Tag, 
  Plus, 
  Trash2, 
  ExternalLink,
  Lock,
  Zap,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SystemTag {
  id: string;
  tag_name: string;
  target_software: string;
  campaign_id: string;
  campaign_name: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

interface Integration {
  id: string;
  name: string;
  provider_id: string;
}

const SOFTWARE_OPTIONS = [
  { id: 'sendiio', name: 'Sendiio' },
  { id: 'workflowswift', name: 'WorkflowSwift' },
  { id: 'adaswift', name: 'ADASwift' },
  { id: 'missedcall', name: 'MissedCallResponder' },
  { id: 'globalcontrol', name: 'Global Control' },
  { id: 'webhook', name: 'Custom Webhook' },
];

export default function TagsManagementPage() {
  const [tags, setTags] = useState<SystemTag[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTag, setNewTag] = useState({
    tag_name: '',
    target_software: '',
    campaign_id: '',
    campaign_name: '',
  });
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load system tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('system_tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (tagsError) throw tagsError;
      setTags(tagsData || []);

      // Load available integrations
      const { data: intData, error: intError } = await supabase
        .from('tenant_integrations')
        .select('id, name, provider_id')
        .eq('is_active', true);

      if (intError) throw intError;
      setIntegrations(intData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newTag.tag_name || !newTag.target_software) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await supabase
        .from('system_tags')
        .insert({
          tag_name: newTag.tag_name,
          target_software: newTag.target_software,
          campaign_id: newTag.campaign_id || null,
          campaign_name: newTag.campaign_name || null,
          is_system: true,
          is_active: true,
        });

      if (error) throw error;

      toast.success('System tag created');
      setNewTag({
        tag_name: '',
        target_software: '',
        campaign_id: '',
        campaign_name: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteTag(tagId: string) {
    try {
      const { error } = await supabase
        .from('system_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  }

  async function toggleTag(tagId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('system_tags')
        .update({ is_active: !currentStatus })
        .eq('id', tagId);

      if (error) throw error;

      toast.success(currentStatus ? 'Tag deactivated' : 'Tag activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update tag');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">System Tags</h1>
          <p className="text-[#64748B]">Manage hard-coded tags that map to external campaigns</p>
        </div>
        <Badge className="bg-[#5B4FFF]/20 text-[#5B4FFF]">
          <Lock className="h-3 w-3 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      {/* Create Tag Dialog */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#5B4FFF]" />
            Create New System Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createTag} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Tag Name *</label>
                <Input
                  value={newTag.tag_name}
                  onChange={(e) => setNewTag({ ...newTag, tag_name: e.target.value })}
                  placeholder="e.g., bizexpo-fl-website"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  This is the tag tenants will see and assign
                </p>
              </div>

              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Target Software *</label>
                <Select
                  value={newTag.target_software}
                  onValueChange={(value) => setNewTag({ ...newTag, target_software: value })}
                >
                  <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]">
                    <SelectValue placeholder="Select software..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                    {SOFTWARE_OPTIONS.map((sw) => (
                      <SelectItem key={sw.id} value={sw.id} className="text-[#F1F5F9]">
                        {sw.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Campaign ID</label>
                <Input
                  value={newTag.campaign_id}
                  onChange={(e) => setNewTag({ ...newTag, campaign_id: e.target.value })}
                  placeholder="e.g., campaign_123"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  The campaign ID in the external software
                </p>
              </div>

              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Campaign Name</label>
                <Input
                  value={newTag.campaign_name}
                  onChange={(e) => setNewTag({ ...newTag, campaign_name: e.target.value })}
                  placeholder="e.g., Biz Expo Follow-up"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
            >
              {isCreating ? 'Creating...' : 'Create System Tag'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Tags */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#5B4FFF]" />
            System Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tags.map((tag) => (
              <div 
                key={tag.id}
                className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#5B4FFF]/20 rounded-lg flex items-center justify-center">
                    <Tag className="h-5 w-5 text-[#5B4FFF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#F1F5F9]">{tag.tag_name}</p>
                      {tag.is_system && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                      <Badge 
                        className={tag.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                      >
                        {tag.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-[#2A2D38] text-[#94A3B8]">
                        <Zap className="h-3 w-3 mr-1" />
                        {SOFTWARE_OPTIONS.find(s => s.id === tag.target_software)?.name || tag.target_software}
                      </Badge>
                      {tag.campaign_name && (
                        <span className="text-sm text-[#64748B]">
                          → {tag.campaign_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTag(tag.id, tag.is_active)}
                    className={tag.is_active ? 'text-green-400' : 'text-[#64748B]'}
                  >
                    {tag.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTag(tag.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {tags.length === 0 && (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-[#2A2D38] mx-auto mb-4" />
                <p className="text-[#64748B]">No system tags created yet</p>
                <p className="text-sm text-[#64748B] mt-1">
                  Create tags above to map them to external campaigns
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#5B4FFF]" />
            How System Tags Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-[#94A3B8]">
          <p>1. <strong className="text-[#F1F5F9]">Super Admin creates system tags</strong> that map to external software campaigns</p>
          <p>2. <strong className="text-[#F1F5F9]">Tenants can assign these tags</strong> to leads but cannot modify them</p>
          <p>3. <strong className="text-[#F1F5F9]">When a tag is assigned</strong>, it fires a webhook to the external software</p>
          <p>4. <strong className="text-[#F1F5F9]">External software receives the lead</strong> and adds them to the campaign</p>
        </CardContent>
      </Card>
    </div>
  );
}
