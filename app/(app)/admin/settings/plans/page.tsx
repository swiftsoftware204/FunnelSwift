'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Users, CreditCard, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Demo',
    price: '$0',
    period: '/mo',
    description: 'Try before you buy',
    features: [
      '1 SMS number',
      '50 contacts',
      'Basic templates',
      'Email support',
    ],
    limits: { sms: 1, contacts: 50 },
    popular: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'For small businesses',
    features: [
      '3 SMS numbers',
      '500 contacts',
      'Advanced templates',
      'Priority support',
      'Basic automations',
    ],
    limits: { sms: 3, contacts: 500 },
    popular: true,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/mo',
    description: 'For growing teams',
    features: [
      '10 SMS numbers',
      '5,000 contacts',
      'Custom templates',
      'Phone support',
      'Advanced automations',
      'API access',
    ],
    limits: { sms: 10, contacts: 5000 },
    popular: false,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    description: 'For large organizations',
    features: [
      'Unlimited SMS numbers',
      'Unlimited contacts',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: { sms: 'Unlimited', contacts: 'Unlimited' },
    popular: false,
  },
];

export default function PlansSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Plans & Pricing</h1>
          <p className="text-[#94A3B8] mt-1">
            Manage subscription plans and feature limits
          </p>
        </div>
        <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
          <Zap className="h-4 w-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`bg-[#16181D] border-[#2A2D38] ${plan.popular ? 'border-[#5B4FFF] ring-1 ring-[#5B4FFF]' : ''}`}
          >
            {plan.popular && (
              <div className="bg-[#5B4FFF] text-white text-xs font-bold text-center py-1">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-[#F1F5F9]">{plan.name}</CardTitle>
              <p className="text-[#94A3B8] text-sm">{plan.description}</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#F1F5F9]">{plan.price}</span>
                <span className="text-[#64748B]">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-[#5B4FFF]" />
                  <span className="text-[#94A3B8]">SMS Numbers:</span>
                  <span className="text-[#F1F5F9] font-medium">{plan.limits.sms}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-[#5B4FFF]" />
                  <span className="text-[#94A3B8]">Contacts:</span>
                  <span className="text-[#F1F5F9] font-medium">{plan.limits.contacts}</span>
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-[#94A3B8]">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full border-[#2A2D38]"
              >
                Edit Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Plan Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Default Plan</label>
              <select className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]">
                <option>Demo</option>
                <option>Starter</option>
                <option>Professional</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Trial Days</label>
              <Input value="14" className="bg-[#0E0F12] border-[#2A2D38]" />
            </div>
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Currency</label>
              <select className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
