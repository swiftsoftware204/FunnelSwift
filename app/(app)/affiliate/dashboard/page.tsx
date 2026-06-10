'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Users, TrendingUp, Copy, Check, Link as LinkIcon } from 'lucide-react';

export default function AffiliateDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadAffiliateData();
  }, []);

  async function loadAffiliateData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        const { data: referralsData } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', profileData.id)
          .order('created_at', { ascending: false });

        setReferrals(referralsData || []);

        const { data: commissionsData } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', profileData.id)
          .order('created_at', { ascending: false });

        setCommissions(commissionsData || []);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function copyReferralLink() {
    if (profile?.referral_link) {
      navigator.clipboard.writeText(profile.referral_link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Not an Affiliate Yet</h2>
        <p className="text-[#94A3B8] mb-4">Apply to become an affiliate and start earning commissions.</p>
        <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
          Apply Now
        </Button>
      </div>
    );
  }

  if (profile.status !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Application Pending</h2>
        <p className="text-[#94A3B8]">Your application is being reviewed. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Affiliate Dashboard</h1>
        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Referrals</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{profile.total_referrals || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Conversions</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{profile.total_conversions || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-[#64748B]">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">${(profile.pending_commissions || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${(profile.total_commissions || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-gradient-to-r from-[#5B4FFF]/10 to-purple-500/10 border-[#5B4FFF]/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-[#5B4FFF]" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <code className="flex-1 bg-[#0E0F12] p-3 rounded-lg text-[#F1F5F9] text-sm break-all">
              {profile.referral_link}
            </code>
            <Button onClick={copyReferralLink} className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-[#64748B] text-center py-4">No referrals yet. Share your link!</p>
          ) : (
            <div className="space-y-2">
              {referrals.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-[#0E0F12] rounded-lg">
                  <div>
                    <p className="text-[#F1F5F9]">{referral.referred_email}</p>
                    <p className="text-xs text-[#64748B]">{new Date(referral.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={referral.status === 'converted' ? 'default' : 'secondary'}>
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
