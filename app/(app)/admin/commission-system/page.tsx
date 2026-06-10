'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Percent, Save, Plus, Trash2, Tag } from 'lucide-react';

interface CommissionSetting {
  id: string;
  software_name: string;
  system_tag: string;
  commission_type: 'percentage' | 'flat';
  commission_amount: number;
  pricing_range: string;
  is_active: boolean;
}

export default function CommissionSystemPage() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_tags')
        .select('*')
        .eq('is_commissionable', true)
        .order('target_software', { ascending: true });

      if (error) throw error;

      const formatted: CommissionSetting[] = (data || []).map(tag => ({
        id: tag.id,
        software_name: tag.target_software,
        system_tag: tag.tag_name,
        commission_type: tag.commission_type,
        commission_amount: tag.commission_amount,
        pricing_range: tag.target_software === 'adaswift' ? '$29-$199/mo' :
                       tag.target_software === 'missedcall' ? '$49-$299/mo' :
                       tag.target_software === 'workflowswift' ? '$39-$249/mo' : 'Varies',
        is_active: tag.is_active,
      }));

      setSettings(formatted);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load commission settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateCommission(id: string, updates: Partial<CommissionSetting>) {
    try {
      const { error } = await supabase
        .from('system_tags')
        .update({
          commission_type: updates.commission_type,
          commission_amount: updates.commission_amount,
          is_active: updates.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Commission updated');
      loadSettings();
      setEditing(null);
    } catch (error) {
      toast.error('Failed to update');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Commission System</h1>
        <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Commission Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Default Commission</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">30%</p>
          </CardContent>
        </Card>
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Total Paid Out</span>
            </div>
            <p className="text-2xl font-bold text-green-400">$12,450</p>
          </CardContent>
        </Card>
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-[#64748B]">Active Rules</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{settings.filter(s => s.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Commission Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="p-4 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 bg-[#16181D] rounded text-sm text-[#5B4FFF]">
                      {setting.system_tag}
                    </code>
                    <span className="text-[#94A3B8]">→</span>
                    <span className="font-medium text-[#F1F5F9]">{setting.software_name}</span>
                  </div>
                  <Badge className={setting.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                    {setting.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {editing === setting.id ? (
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-[#64748B] mb-1 block">Type</label>
                      <Select
                        value={setting.commission_type}
                        onValueChange={(value) => updateCommission(setting.id, { commission_type: value as 'percentage' | 'flat' })}
                      >
                        <SelectTrigger className="bg-[#16181D] border-[#2A2D38]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="flat">Flat Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[#64748B] mb-1 block">Amount</label>
                      <Input
                        type="number"
                        value={setting.commission_amount}
                        onChange={(e) => updateCommission(setting.id, { commission_amount: parseFloat(e.target.value) })}
                        className="bg-[#16181D] border-[#2A2D38]"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                      onClick={() => setEditing(null)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#64748B]">Commission</p>
                      <p className="text-lg font-bold text-[#F1F5F9]">
                        {setting.commission_type === 'percentage' 
                          ? `${setting.commission_amount}%` 
                          : `$${setting.commission_amount}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2A2D38]"
                        onClick={() => setEditing(setting.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
