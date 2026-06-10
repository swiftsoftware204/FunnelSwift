'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Users, Percent, Settings } from 'lucide-react';

export default function AffiliateSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Affiliate Settings</h1>
        <p className="text-[#94A3B8] mt-1">
          Manage commissions, tiers, and payouts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Percent className="h-5 w-5 text-[#5B4FFF]" />
              Commission Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Demo/Free</label>
                <Input value="20%" className="bg-[#0E0F12] border-[#2A2D38]" />
              </div>
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Starter</label>
                <Input value="25%" className="bg-[#0E0F12] border-[#2A2D38]" />
              </div>
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Pro</label>
                <Input value="30%" className="bg-[#0E0F12] border-[#2A2D38]" />
              </div>
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Enterprise</label>
                <Input value="35%" className="bg-[#0E0F12] border-[#2A2D38]" />
              </div>
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              Manage Commission System →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#5B4FFF]" />
              Payout Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Minimum Payout</label>
              <Input value="$50" className="bg-[#0E0F12] border-[#2A2D38]" />
            </div>
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Payout Schedule</label>
              <select className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]">
                <option>Monthly (1st of month)</option>
                <option>Bi-weekly</option>
                <option>Weekly</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5B4FFF]" />
              Affiliate Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-[#0E0F12] rounded">
              <span className="text-[#F1F5F9]">Total Affiliates</span>
              <span className="text-[#5B4FFF] font-bold">0</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0E0F12] rounded">
              <span className="text-[#F1F5F9]">Pending Applications</span>
              <span className="text-yellow-500 font-bold">0</span>
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              View All Affiliates →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#5B4FFF]" />
              Program Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Cookie Duration</label>
              <Input value="60 days" className="bg-[#0E0F12] border-[#2A2D38]" />
            </div>
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Referral Tracking</label>
              <select className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]">
                <option>First touch (default)</option>
                <option>Last touch</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
