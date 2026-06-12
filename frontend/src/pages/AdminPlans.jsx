import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Percent, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingCommission, setEditingCommission] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load plans
    const { data: plansData } = await supabase
      .from('funnelswift_plans')
      .select('*')
      .order('display_order');
    setPlans(plansData || []);
    
    // Load affiliates
    const { data: affiliatesData } = await supabase
      .from('affiliate_profiles')
      .select('id, affiliate_code, display_name, email')
      .eq('status', 'approved')
      .order('display_name');
    setAffiliates(affiliatesData || []);
    
    // Load commission summary
    const { data: commissionData } = await supabase
      .from('affiliate_commission_summary')
      .select('*');
    setCommissionRates(commissionData || []);
    
    setLoading(false);
  };

  const savePlan = async (plan) => {
    const { error } = await supabase
      .from('funnelswift_plans')
      .upsert(plan);
    
    if (!error) {
      setEditingPlan(null);
      loadData();
    }
  };

  const saveCommissionRate = async (rate) => {
    const { error } = await supabase
      .from('affiliate_plan_commissions')
      .upsert({
        affiliate_id: rate.affiliate_id,
        plan_id: rate.plan_id,
        custom_commission_rate: rate.custom_commission_rate,
        custom_commission_type: rate.custom_commission_type || 'percentage',
        custom_cross_system_rate: rate.custom_cross_system_rate,
        notes: rate.notes,
        effective_from: new Date().toISOString(),
      }, {
        onConflict: 'affiliate_id,plan_id'
      });
    
    if (!error) {
      setEditingCommission(null);
      loadData();
    }
  };

  const deleteCustomRate = async (affiliateId, planId) => {
    if (!confirm('Remove custom commission rate?')) return;
    
    await supabase
      .from('affiliate_plan_commissions')
      .delete()
      .eq('affiliate_id', affiliateId)
      .eq('plan_id', planId);
    
    loadData();
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Plan & Commission Management</h1>
        <p className="text-gray-400">Manage FunnelSwift plans and affiliate commission rates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1e2130] p-1 rounded-lg w-fit">
        {['plans', 'commissions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md capitalize font-medium ${
              activeTab === tab
                ? 'bg-[#5B4FFF] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'plans' ? 'FunnelSwift Plans' : 'Affiliate Commission Rates'}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Plans</h2>
            <button
              onClick={() => setEditingPlan({
                name: '',
                slug: '',
                description: '',
                price_monthly: 0,
                price_yearly: 0,
                is_free: false,
                default_commission_rate: 30,
                cross_system_commission_rate: 30,
                features: [],
                is_active: true,
              })}
              className="flex items-center gap-2 px-4 py-2 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#4a3fe0]"
            >
              <Plus size={20} />
              Add Plan
            </button>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#1e2130] rounded-lg p-6 border border-[#2e3245]"
              >
                {editingPlan?.id === plan.id ? (
                  <PlanEditForm
                    plan={editingPlan}
                    onSave={savePlan}
                    onCancel={() => setEditingPlan(null)}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                        {plan.is_free && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            FREE
                          </span>
                        )}
                        {plan.is_popular && (
                          <span className="px-2 py-1 bg-[#5B4FFF]/20 text-[#5B4FFF] text-xs rounded">
                            POPULAR
                          </span>
                        )}
                        {!plan.is_active && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-400 mb-4">{plan.description}</p>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Monthly</p>
                          <p className="text-lg font-semibold text-white">
                            {plan.is_free ? 'Free' : `$${plan.price_monthly}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Yearly</p>
                          <p className="text-lg font-semibold text-white">
                            {plan.is_free ? 'Free' : `$${plan.price_yearly}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Commission</p>
                          <p className="text-lg font-semibold text-[#5B4FFF]">
                            {plan.default_commission_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Cross-System</p>
                          <p className="text-lg font-semibold text-[#5B4FFF]">
                            {plan.cross_system_commission_rate}%
                          </p>
                        </div>
                      </div>

                      {plan.features && (
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-[#0f1117] text-gray-300 text-sm rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="p-2 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="bg-[#1e2130] rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Default Commission Rates</h3>
            <p className="text-gray-400 text-sm mb-4">
              Override these per affiliate below. Custom rates take precedence over defaults.
            </p>
            <div className="grid grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-[#0f1117] rounded p-3">
                  <p className="text-xs text-gray-500 uppercase">{plan.name}</p>
                  <p className="text-xl font-bold text-[#5B4FFF]">{plan.default_commission_rate}%</p>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Affiliate Commission Rates</h3>

          <div className="bg-[#1e2130] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0f1117]">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Affiliate</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 text-gray-400 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-t border-[#2e3245]">
                    <td className="p-4">
                      <p className="text-white font-medium">{affiliate.display_name}</p>
                      <p className="text-sm text-gray-500">{affiliate.affiliate_code}</p>
                    </td>
                    {plans.map((plan) => {
                      const rate = commissionRates.find(
                        (r) => r.affiliate_id === affiliate.id && r.plan_id === plan.id
                      );
                      const isCustom = rate?.has_custom_rate;
                      
                      return (
                        <td key={plan.id} className="p-4 text-center">
                          {editingCommission?.affiliate_id === affiliate.id && 
                           editingCommission?.plan_id === plan.id ? (
                            <CommissionEditForm
                              rate={editingCommission}
                              onSave={saveCommissionRate}
                              onCancel={() => setEditingCommission(null)}
                              onDelete={() => deleteCustomRate(affiliate.id, plan.id)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingCommission({
                                affiliate_id: affiliate.id,
                                plan_id: plan.id,
                                affiliate_name: affiliate.display_name,
                                plan_name: plan.name,
                                custom_commission_rate: rate?.commission_rate || plan.default_commission_rate,
                                custom_commission_type: 'percentage',
                                custom_cross_system_rate: rate?.commission_rate || plan.cross_system_commission_rate,
                                notes: rate?.custom_rate_notes || '',
                              })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                isCustom
                                  ? 'bg-[#5B4FFF] text-white'
                                  : 'bg-[#0f1117] text-gray-400 hover:text-white'
                              }`}
                            >
                              {rate?.commission_rate || plan.default_commission_rate}%
                              {isCustom && <span className="ml-1 text-xs">★</span>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Plan Edit Form Component
function PlanEditForm({ plan, onSave, onCancel }) {
  const [formData, setFormData] = useState(plan);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Plan Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Monthly Price</label>
          <input
            type="number"
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Yearly Price</label>
          <input
            type="number"
            value={formData.price_yearly}
            onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Commission %</label>
          <input
            type="number"
            value={formData.default_commission_rate}
            onChange={(e) => setFormData({ ...formData, default_commission_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cross-System %</label>
          <input
            type="number"
            value={formData.cross_system_commission_rate}
            onChange={(e) => setFormData({ ...formData, cross_system_commission_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={formData.is_free}
            onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
          />
          Free Plan
        </label>
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={formData.is_popular}
            onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
          />
          Popular
        </label>
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onSave(formData)}
          className="flex items-center gap-2 px-4 py-2 bg-[#5B4FFF] text-white rounded-lg"
        >
          <Save size={18} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1117] text-gray-400 rounded-lg"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// Commission Edit Form Component
function CommissionEditForm({ rate, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState(rate);

  return (
    <div className="bg-[#0f1117] rounded-lg p-3 space-y-3 min-w-[200px]">
      <p className="text-sm text-gray-400">
        {rate.affiliate_name} → {rate.plan_name}
      </p>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Commission Rate (%)</label>
        <input
          type="number"
          value={formData.custom_commission_rate}
          onChange={(e) => setFormData({ ...formData, custom_commission_rate: parseFloat(e.target.value) })}
          className="w-full px-2 py-1 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Cross-System Rate (%)</label>
        <input
          type="number"
          value={formData.custom_cross_system_rate}
          onChange={(e) => setFormData({ ...formData, custom_cross_system_rate: parseFloat(e.target.value) })}
          className="w-full px-2 py-1 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="VIP affiliate, etc."
          className="w-full px-2 py-1 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          className="flex-1 px-2 py-1 bg-[#5B4FFF] text-white rounded text-sm"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 bg-[#2e3245] text-gray-400 rounded text-sm"
        >
          <X size={14} />
        </button>
        <button
          onClick={onDelete}
          className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
