import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Check, ToggleLeft, ToggleRight, DollarSign, Users, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FEATURE_CATEGORIES = {
  core: { label: 'Core Features', color: 'bg-blue-500' },
  capture: { label: 'Lead Capture', color: 'bg-green-500' },
  automation: { label: 'Automation', color: 'bg-purple-500' },
  communication: { label: 'Communication', color: 'bg-yellow-500' },
  integrations: { label: 'Integrations', color: 'bg-pink-500' },
  advanced: { label: 'Advanced', color: 'bg-red-500' },
  reporting: { label: 'Reporting', color: 'bg-cyan-500' },
  affiliate: { label: 'Affiliate', color: 'bg-orange-500' },
  support: { label: 'Support', color: 'bg-gray-500' },
};

export default function AdminPlansWithFeatures() {
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [planFeatures, setPlanFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingFeatures, setEditingFeatures] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [editingAffiliate, setEditingAffiliate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load plans with features
    const { data: plansData } = await supabase
      .from('plans_with_features')
      .select('*')
      .order('display_order');
    
    if (plansData) {
      setPlans(plansData);
      
      // Organize plan features by plan ID
      const pfMap = {};
      plansData.forEach(plan => {
        pfMap[plan.id] = plan.features || [];
      });
      setPlanFeatures(pfMap);
    }
    
    // Load all feature definitions
    const { data: featuresData } = await supabase
      .from('feature_definitions')
      .select('*')
      .order('sort_order');
    setFeatures(featuresData || []);
    
    // Load affiliates for super affiliate management
    const { data: affiliatesData } = await supabase
      .from('admin_affiliate_management')
      .select('*')
      .order('is_super_affiliate', { ascending: false })
      .order('total_commissions', { ascending: false });
    setAffiliates(affiliatesData || []);
    
    setLoading(false);
  };

  const savePlanPricing = async (plan) => {
    const { error } = await supabase
      .from('funnelswift_plans')
      .update({
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        default_commission_rate: plan.default_commission_rate,
        cross_system_commission_rate: plan.cross_system_commission_rate,
        is_active: plan.is_active,
        is_popular: plan.is_popular,
      })
      .eq('id', plan.id);
    
    if (!error) {
      setEditingPlan(null);
      loadData();
    }
  };

  const toggleFeature = async (planId, featureKey, currentEnabled) => {
    const { error } = await supabase
      .from('plan_features')
      .upsert({
        plan_id: planId,
        feature_key: featureKey,
        is_enabled: !currentEnabled,
      }, {
        onConflict: 'plan_id,feature_key'
      });
    
    if (!error) {
      loadData();
    }
  };

  const updateFeatureLimit = async (planId, featureKey, newLimit) => {
    const { error } = await supabase
      .from('plan_features')
      .upsert({
        plan_id: planId,
        feature_key: featureKey,
        custom_limit: newLimit === '' ? null : parseInt(newLimit),
      }, {
        onConflict: 'plan_id,feature_key'
      });
    
    if (!error) {
      loadData();
    }
  };

  const getFeatureStatus = (planId, featureKey) => {
    const planFeats = planFeatures[planId] || [];
    return planFeats.find(f => f.key === featureKey) || { is_enabled: false, limit: 0 };
  };

  const toggleSuperAffiliate = async (affiliateId, makeSuper, globalRate = null) => {
    const { error } = await supabase
      .rpc('toggle_super_affiliate', {
        p_affiliate_id: affiliateId,
        p_make_super: makeSuper,
        p_global_rate: globalRate,
        p_reason: makeSuper ? 'Promoted to Super Affiliate' : 'Removed from Super Affiliate',
      });
    
    if (!error) {
      loadData();
      setEditingAffiliate(null);
    }
  };

  const groupFeaturesByCategory = () => {
    const grouped = {};
    features.forEach(feature => {
      if (!grouped[feature.category]) {
        grouped[feature.category] = [];
      }
      grouped[feature.category].push(feature);
    });
    return grouped;
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  const groupedFeatures = groupFeaturesByCategory();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Plan & Feature Management</h1>
        <p className="text-gray-400">Edit pricing and toggle features for each plan</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1e2130] p-1 rounded-lg w-fit">
        {['plans', 'features', 'affiliates'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md capitalize font-medium ${
              activeTab === tab
                ? 'bg-[#5B4FFF] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'plans' ? 'Pricing & Plans' : tab === 'features' ? 'Feature Toggles' : 'Super Affiliates'}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#1e2130] rounded-lg p-6 border-2 ${
                  plan.is_popular ? 'border-[#5B4FFF]' : 'border-[#2e3245]'
                }`}
              >
                {editingPlan?.id === plan.id ? (
                  <PlanEditForm
                    plan={editingPlan}
                    onSave={savePlanPricing}
                    onCancel={() => setEditingPlan(null)}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        {plan.is_popular && (
                          <span className="text-xs text-[#5B4FFF] font-medium">MOST POPULAR</span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="p-2 text-gray-400 hover:text-white"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <DollarSign className="text-white" size={24} />
                        <span className="text-4xl font-bold text-white">{plan.price_monthly}</span>
                        <span className="text-gray-400">/mo</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        or ${plan.price_yearly}/year
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Commission:</span>
                        <span className="text-[#5B4FFF] font-medium">{plan.default_commission_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Cross-System:</span>
                        <span className="text-[#5B4FFF] font-medium">{plan.cross_system_commission_rate}%</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        plan.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Affiliate Management</h2>
              <p className="text-gray-400">Toggle Super Affiliate status and set custom commission rates</p>
            </div>
          </div>

          <div className="bg-[#1e2130] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0f1117]">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Affiliate</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Commission Rate</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Referrals</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Earnings</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.affiliate_id} className="border-t border-[#2e3245]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {affiliate.affiliate_name}
                            {affiliate.is_super_affiliate && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                ⭐ SUPER
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{affiliate.affiliate_code}</p>
                          <p className="text-sm text-gray-500">{affiliate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        affiliate.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {editingAffiliate?.affiliate_id === affiliate.affiliate_id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            defaultValue={affiliate.effective_commission_rate}
                            className="w-16 px-2 py-1 bg-[#0f1117] border border-[#2e3245] rounded text-center text-white"
                            onChange={(e) => editingAffiliate.newRate = parseFloat(e.target.value)}
                          />
                          <span className="text-gray-400">%</span>
                        </div>
                      ) : (
                        <span className={`text-lg font-semibold ${
                          affiliate.is_super_affiliate ? 'text-yellow-400' : 'text-[#5B4FFF]'
                        }`}>
                          {affiliate.effective_commission_rate}%
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-white">
                      {affiliate.total_referrals}
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-white font-medium">
                        ${affiliate.total_commissions?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${affiliate.pending_commissions?.toFixed(2) || '0.00'} pending
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      {editingAffiliate?.affiliate_id === affiliate.affiliate_id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => toggleSuperAffiliate(
                              affiliate.affiliate_id, 
                              !affiliate.is_super_affiliate,
                              editingAffiliate.newRate || affiliate.effective_commission_rate
                            )}
                            className="px-3 py-1 bg-[#5B4FFF] text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAffiliate(null)}
                            className="px-3 py-1 bg-[#0f1117] text-gray-400 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingAffiliate({
                            affiliate_id: affiliate.affiliate_id,
                            is_super: affiliate.is_super_affiliate,
                            currentRate: affiliate.effective_commission_rate,
                          })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            affiliate.is_super_affiliate
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-[#5B4FFF] text-white hover:bg-[#4a3fe0]'
                          }`}
                        >
                          {affiliate.is_super_affiliate ? 'Edit Super' : 'Make Super'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="bg-[#1e2130] rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Super Affiliate Benefits</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>⭐ Higher commission rates (customizable per affiliate)</li>
              <li>⭐ Global override - applies to ALL products</li>
              <li>⭐ Special perks and early access</li>
              <li>⭐ Dedicated support</li>
              <li>⭐ Co-marketing opportunities</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category} className="bg-[#1e2130] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${FEATURE_CATEGORIES[category]?.color || 'bg-gray-500'}`} />
                <h3 className="text-lg font-semibold text-white">
                  {FEATURE_CATEGORIES[category]?.label || category}
                </h3>
                <span className="text-sm text-gray-500">({categoryFeatures.length} features)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2e3245]">
                      <th className="text-left p-3 text-gray-400 font-medium">Feature</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="text-center p-3 text-gray-400 font-medium min-w-[120px]">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryFeatures.map((feature) => (
                      <tr key={feature.key} className="border-b border-[#2e3245]/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{feature.name}</span>
                            {feature.is_core && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                                Core
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{feature.description}</p>
                        </td>
                        {plans.map((plan) => {
                          const status = getFeatureStatus(plan.id, feature.key);
                          const isEnabled = status.is_enabled;
                          const limit = status.limit;
                          
                          return (
                            <td key={plan.id} className="p-3 text-center">
                              <div className="flex flex-col items-center gap-2">
                                {/* Toggle Button */}
                                <button
                                  onClick={() => toggleFeature(plan.id, feature.key, isEnabled)}
                                  disabled={feature.is_core}
                                  className={`p-2 rounded-lg transition ${
                                    feature.is_core 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-[#2e3245]'
                                  } ${
                                    isEnabled 
                                      ? 'text-green-400' 
                                      : 'text-gray-600'
                                  }`}
                                  title={feature.is_core ? 'Core feature (always enabled)' : (isEnabled ? 'Enabled' : 'Disabled')}
                                >
                                  {isEnabled ? (
                                    <ToggleRight size={28} />
                                  ) : (
                                    <ToggleLeft size={28} />
                                  )}
                                </button>

                                {/* Limit Input (if enabled and has unit) */}
                                {isEnabled && feature.unit_label && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={limit === -1 ? '∞' : limit}
                                      onChange={(e) => updateFeatureLimit(plan.id, feature.key, e.target.value === '∞' ? -1 : e.target.value)}
                                      className="w-16 px-2 py-1 bg-[#0f1117] border border-[#2e3245] rounded text-center text-white text-sm"
                                    />
                                    <span className="text-xs text-gray-500">{feature.unit_label}</span>
                                  </div>
                                )}

                                {/* Unlimited indicator */}
                                {isEnabled && limit === -1 && !feature.unit_label && (
                                  <span className="text-xs text-green-400">Unlimited</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
      <div>
        <label className="block text-sm text-gray-400 mb-1">Plan Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Monthly Price</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="number"
              value={formData.price_monthly}
              onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Yearly Price</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="number"
              value={formData.price_yearly}
              onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Commission %</label>
          <div className="relative">
            <input
              type="number"
              value={formData.default_commission_rate}
              onChange={(e) => setFormData({ ...formData, default_commission_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cross-System %</label>
          <div className="relative">
            <input
              type="number"
              value={formData.cross_system_commission_rate}
              onChange={(e) => setFormData({ ...formData, cross_system_commission_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-[#0f1117] border border-[#2e3245] rounded text-white"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-white text-sm">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-white text-sm">
          <input
            type="checkbox"
            checked={formData.is_popular}
            onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
          />
          Popular
        </label>
      </div>

      <div className="flex gap-2">
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
