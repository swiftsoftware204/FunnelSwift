'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Download, DollarSign, Users, TrendingUp, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateDetailPage() {
  const params = useParams();
  const affiliateId = params.id as string;
  
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (affiliateId) {
      loadAffiliateData();
    }
  }, [affiliateId]);

  async function loadAffiliateData() {
    setIsLoading(true);
    try {
      // Load affiliate profile
      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('*, user:user_id(email, created_at)')
        .eq('id', affiliateId)
        .single();

      if (profile) {
        setAffiliate(profile);

        // Load referrals with full attribution
        const { data: refs } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', affiliateId)
          .order('created_at', { ascending: false });

        setReferrals(refs || []);

        // Load commissions
        const { data: comms } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', affiliateId)
          .order('created_at', { ascending: false });

        setCommissions(comms || []);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast.error('Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  }

  function downloadReferralsCSV() {
    const headers = ['Date', 'Email', 'Source', 'Landing Page', 'UTM Source', 'UTM Campaign', 'Status', 'Converted', 'Commission'];
    const rows = referrals.map(r => [
      new Date(r.signed_up_at).toLocaleDateString(),
      r.referred_email,
      r.referral_source || 'Direct',
      r.landing_page || '',
      r.utm_source || '',
      r.utm_campaign || '',
      r.status,
      r.status === 'converted' ? 'Yes' : 'No',
      r.commission_earned || '0'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `affiliate-${affiliateId}-referrals.csv`);
  }

  function downloadCommissionsCSV() {
    const headers = ['Date', 'Transaction Type', 'Product', 'Amount', 'Commission Rate', 'Commission', 'Status'];
    const rows = commissions.map(c => [
      new Date(c.created_at).toLocaleDateString(),
      c.transaction_type,
      c.product_name,
      c.transaction_amount,
      c.commission_rate + '%',
      c.commission_amount,
      c.status
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `affiliate-${affiliateId}-commissions.csv`);
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Download started!');
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  if (!affiliate) {
    return <div className="p-8 text-center text-[#64748B]">Affiliate not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/affiliates">
          <Button variant="outline" className="border-[#2A2D38]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">
          Affiliate: {affiliate.user?.email}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{affiliate.total_referrals || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Conversions</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{affiliate.total_conversions || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-[#64748B]">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">${(affiliate.pending_commissions || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${(affiliate.total_commissions || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-gradient-to-r from-[#5B4FFF]/10 to-purple-500/10 border-[#5B4FFF]/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-[#5B4FFF]" />
              <span className="text-[#F1F5F9]">Referral Link:</span>
              <code className="text-[#5B4FFF]">{affiliate.referral_link}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2A2D38]"
              onClick={() => {
                navigator.clipboard.writeText(affiliate.referral_link);
                toast.success('Link copied!');
              }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#F1F5F9]">Referrals ({referrals.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-[#2A2D38]"
            onClick={downloadReferralsCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No referrals yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref.id} className="p-3 bg-[#0E0F12] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#F1F5F9]">{ref.referred_email}</p>
                      <p className="text-xs text-[#64748B]">
                        Source: {ref.referral_source || 'Direct'} | 
                        {ref.utm_source && ` UTM: ${ref.utm_source}`} |
                        {ref.utm_campaign && ` Campaign: ${ref.utm_campaign}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={ref.status === 'converted' ? 'default' : 'secondary'}>
                        {ref.status}
                      </Badge>
                      {ref.commission_earned > 0 && (
                        <p className="text-sm text-green-400 mt-1">
                          +${ref.commission_earned}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#F1F5F9]">Commissions ({commissions.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-[#2A2D38]"
            onClick={downloadCommissionsCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No commissions yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {commissions.map((comm) => (
                <div key={comm.id} className="p-3 bg-[#0E0F12] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#F1F5F9]">{comm.product_name}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(comm.created_at).toLocaleDateString()} | 
                        Sale: ${comm.transaction_amount} | 
                        Rate: {comm.commission_rate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">+${comm.commission_amount}</p>
                      <Badge variant={comm.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {comm.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
