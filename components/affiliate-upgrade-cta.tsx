'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AffiliateUpgradeCTA() {
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateStats, setAffiliateStats] = useState({
    totalReferrals: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  async function checkAffiliateStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setIsAffiliate(profile.status === 'approved');
        setAffiliateStats({
          totalReferrals: profile.total_referrals || 0,
          totalCommissions: profile.total_commissions || 0,
          pendingCommissions: profile.pending_commissions || 0,
        });
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return null;

  // If already affiliate, show stats
  if (isAffiliate) {
    return (
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Your Affiliate Earnings
            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-[#F1F5F9]">
                {affiliateStats.totalReferrals}
              </p>
              <p className="text-xs text-[#64748B]">Total Referrals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F1F5F9]">
                ${affiliateStats.totalCommissions.toFixed(2)}
              </p>
              <p className="text-xs text-[#64748B]">Total Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                ${affiliateStats.pendingCommissions.toFixed(2)}
              </p>
              <p className="text-xs text-[#64748B]">Pending</p>
            </div>
          </div>
          <Link href="/affiliate/dashboard">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Affiliate Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // If not affiliate, show CTA
  return (
    <Card className="bg-gradient-to-r from-[#5B4FFF]/10 to-purple-500/10 border-[#5B4FFF]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-[#5B4FFF]" />
          Become an Affiliate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[#94A3B8] mb-4">
          Earn <span className="text-[#F1F5F9] font-semibold">30% recurring commission</span> on every referral. 
          No limits, no caps. Get paid for helping others grow their business.
        </p>
        <ul className="space-y-2 mb-4 text-sm text-[#94A3B8]">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
            30% commission on all plans
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
            Recurring monthly payments
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
            Track referrals in real-time
          </li>
        </ul>
        <Link href="/affiliate/apply">
          <Button className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
            <DollarSign className="h-4 w-4 mr-2" />
            Apply to Become Affiliate
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
