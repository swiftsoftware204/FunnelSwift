'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Users, CreditCard, Zap, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  sms_numbers_allowed: number;
  sms_numbers_unlimited: boolean;
  contacts_allowed: number;
  contacts_unlimited: boolean;
  team_members_allowed: number;
  team_members_unlimited: boolean;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
}

const defaultFeatures = [
  'SMS numbers',
  'Contact limit',
  'Templates',
  'Support level',
  'Automations',
  'API access',
  'Team members',
  'Custom domains',
  'White-label',
  'Priority support',
];

export default function PlansSettingsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }

  async function savePlan() {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from('plans')
        .upsert({
          ...editingPlan,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Plan saved!');
      setIsDialogOpen(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error) {
      toast.error('Failed to save plan');
    }
  }

  async function deletePlan(planId: string) {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plan deleted');
      loadPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  }

  function createNewPlan() {
    setEditingPlan({
      id: '',
      name: 'New Plan',
      slug: 'new-plan',
      description: 'Plan description',
      monthly_price: 29,
      yearly_price: 290,
      sms_numbers_allowed: 1,
      sms_numbers_unlimited: false,
      contacts_allowed: 100,
      contacts_unlimited: false,
      team_members_allowed: 1,
      team_members_unlimited: false,
      features: ['Basic feature'],
      is_active: true,
      is_popular: false,
      display_order: plans.length,
    });
    setIsDialogOpen(true);
  }

  function editPlan(plan: Plan) {
    setEditingPlan({ ...plan });
    setIsDialogOpen(true);
  }

  function updateFeature(index: number, value: string) {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  }

  function addFeature() {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, 'New feature'] });
  }

  function removeFeature(index: number) {
    if (!editingPlan) return;
    const newFeatures = editingPlan.features.filter((_, i) => i !== index);
    setEditingPlan({ ...editingPlan, features: newFeatures });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Plans & Pricing</h1>
          <p className="text-[#94A3B8] mt-1">
            Manage subscription plans, limits, and team access
          </p>
        </div>
        <Button 
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={createNewPlan}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`bg-[#16181D] border-[#2A2D38] ${plan.is_popular ? 'border-[#5B4FFF] ring-1 ring-[#5B4FFF]' : ''}`}
          >
            {plan.is_popular && (
              <div className="bg-[#5B4FFF] text-white text-xs font-bold text-center py-1">
                MOST POPULAR
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-[#F1F5F9]">{plan.name}</CardTitle>
                  <p className="text-[#94A3B8] text-sm">{plan.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => editPlan(plan)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-400"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#F1F5F9]">${plan.monthly_price}</span>
                <span className="text-[#64748B]">/mo</span>
                {plan.yearly_price > 0 && (
                  <span className="text-sm text-[#64748B] ml-2">
                    or ${plan.yearly_price}/yr
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Limits */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">SMS Numbers:</span>
                  <span className="text-[#F1F5F9]">
                    {plan.sms_numbers_unlimited ? 'Unlimited' : plan.sms_numbers_allowed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Contacts:</span>
                  <span className="text-[#F1F5F9]">
                    {plan.contacts_unlimited ? 'Unlimited' : plan.contacts_allowed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Team Members:</span>
                  <span className="text-[#F1F5F9]">
                    {plan.team_members_unlimited ? 'Unlimited' : plan.team_members_allowed}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {plan.features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-[#94A3B8]">{feature}</span>
                  </div>
                ))}
                {plan.features.length > 4 && (
                  <p className="text-xs text-[#64748B] pl-6">
                    +{plan.features.length - 4} more
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 pt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  plan.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-[#64748B]">
                  Order: {plan.display_order}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F1F5F9]">
              {editingPlan?.id ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Plan Name</label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Slug</label>
                  <Input
                    value={editingPlan.slug}
                    onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Description</label>
                <Input
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Monthly Price ($)</label>
                  <Input
                    type="number"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Yearly Price ($)</label>
                  <Input
                    type="number"
                    value={editingPlan.yearly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearly_price: parseFloat(e.target.value) })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="bg-[#0E0F12] p-4 rounded-lg border border-[#2A2D38]">
                <h3 className="font-medium text-[#F1F5F9] mb-3">Plan Limits</h3>
                
                <div className="space-y-3">
                  {/* SMS Numbers */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-[#94A3B8] w-32">SMS Numbers:</label>
                    <Input
                      type="number"
                      value={editingPlan.sms_numbers_allowed}
                      onChange={(e) => setEditingPlan({ ...editingPlan, sms_numbers_allowed: parseInt(e.target.value) })}
                      disabled={editingPlan.sms_numbers_unlimited}
                      className="bg-[#16181D] border-[#2A2D38] w-24"
                    />
                    <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <input
                        type="checkbox"
                        checked={editingPlan.sms_numbers_unlimited}
                        onChange={(e) => setEditingPlan({ ...editingPlan, sms_numbers_unlimited: e.target.checked })}
                        className="rounded border-[#2A2D38]"
                      />
                      Unlimited
                    </label>
                  </div>

                  {/* Contacts */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-[#94A3B8] w-32">Contacts:</label>
                    <Input
                      type="number"
                      value={editingPlan.contacts_allowed}
                      onChange={(e) => setEditingPlan({ ...editingPlan, contacts_allowed: parseInt(e.target.value) })}
                      disabled={editingPlan.contacts_unlimited}
                      className="bg-[#16181D] border-[#2A2D38] w-24"
                    />
                    <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <input
                        type="checkbox"
                        checked={editingPlan.contacts_unlimited}
                        onChange={(e) => setEditingPlan({ ...editingPlan, contacts_unlimited: e.target.checked })}
                        className="rounded border-[#2A2D38]"
                      />
                      Unlimited
                    </label>
                  </div>

                  {/* Team Members */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-[#94A3B8] w-32">Team Members:</label>
                    <Input
                      type="number"
                      value={editingPlan.team_members_allowed}
                      onChange={(e) => setEditingPlan({ ...editingPlan, team_members_allowed: parseInt(e.target.value) })}
                      disabled={editingPlan.team_members_unlimited}
                      className="bg-[#16181D] border-[#2A2D38] w-24"
                    />
                    <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <input
                        type="checkbox"
                        checked={editingPlan.team_members_unlimited}
                        onChange={(e) => setEditingPlan({ ...editingPlan, team_members_unlimited: e.target.checked })}
                        className="rounded border-[#2A2D38]"
                      />
                      Unlimited
                    </label>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-[#0E0F12] p-4 rounded-lg border border-[#2A2D38]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[#F1F5F9]">Features</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-[#2A2D38]"
                    onClick={addFeature}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="bg-[#16181D] border-[#2A2D38] flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#F1F5F9]">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="rounded border-[#2A2D38]"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-[#F1F5F9]">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_popular}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                    className="rounded border-[#2A2D38]"
                  />
                  Mark as Popular
                </label>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="border-[#2A2D38]"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                  onClick={savePlan}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardContent className="p-4">
          <h3 className="font-medium text-[#F1F5F9] mb-2">Plan Configuration Tips</h3>
          <ul className="text-sm text-[#94A3B8] space-y-1">
            <li>• Team member limits are enforced per plan - users will see upgrade prompts when limits are reached</li>
            <li>• Set &quot;Popular&quot; badge on your recommended plan to highlight it</li>
            <li>• Inactive plans are hidden from new signups but existing users keep access</li>
            <li>• Changes take effect immediately for new signups</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
