'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Tag, TrendingUp, Copy, Check, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';

interface CommissionOffer {
  id: string;
  software_name: string;
  software_icon: string;
  description: string;
  system_tag: string;
  commission_type: 'percentage' | 'flat';
  commission_amount: number;
  pricing: string;
  sales_page_url: string;
  is_active: boolean;
}

export default function AffiliateMarketplacePage() {
  const [offers, setOffers] = useState<CommissionOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadOffers();
    checkAffiliateStatus();
  }, []);

  async function loadOffers() {
    setIsLoading(true);
    try {
      // Load from system_tags that are commissionable
      const { data, error } = await supabase
        .from('system_tags')
        .select('*')
        .eq('is_commissionable', true)
        .eq('is_active', true)
        .order('commission_amount', { ascending: false });

      if (error) throw error;

      // Get user's plan to show correct commission
      const { data: userPlan } = await supabase
        .from('user_profiles')
        .select('plan_slug')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      const planSlug = userPlan?.plan_slug || 'demo';
      
      const formattedOffers: CommissionOffer[] = (data || []).map(tag => {
        // Get commission based on user's plan
        let commissionAmount = tag.commission_demo; // Default 20%
        if (planSlug === 'starter') commissionAmount = tag.commission_starter;
        else if (planSlug === 'professional') commissionAmount = tag.commission_pro;
        else if (planSlug === 'enterprise') commissionAmount = tag.commission_enterprise;
        
        return {
          id: tag.id,
          software_name: tag.target_software === 'adaswift' ? 'ADASwift' : 
                         tag.target_software === 'missedcall' ? 'MissedCall Responder' :
                         tag.target_software === 'workflowswift' ? 'WorkflowSwift' : tag.target_software,
          software_icon: tag.icon || '🎯',
          description: tag.description,
          system_tag: tag.tag_name,
          commission_type: tag.commission_type,
          commission_amount: commissionAmount,
          pricing: tag.pricing_range || 'Contact for pricing',
          sales_page_url: tag.sales_page_url || '#',
          is_active: tag.is_active,
        };
      });

      setOffers(formattedOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Failed to load commission offers');
    } finally {
      setIsLoading(false);
    }
  }

  async function checkAffiliateStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('status')
        .eq('user_id', user.id)
        .single();

      setIsAffiliate(profile?.status === 'approved');
    } catch (error) {
      // Not an affiliate yet
    }
  }

  function copyTag(tag: string) {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast.success('Tag copied! Use this when creating leads.');
    setTimeout(() => setCopiedTag(null), 2000);
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          Affiliate Commission Marketplace
        </h1>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          Promote SwiftSoftware products and earn commissions. Use the system tags below when capturing leads.
        </p>
        {!isAffiliate && (
          <Link href="/affiliate/apply">
            <Button className="mt-4 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
              <Gift className="h-4 w-4 mr-2" />
              Become an Affiliate
            </Button>
          </Link>
        )}
      </div>

      {/* Commission Tiers by Plan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">20%</p>
            <p className="text-xs text-[#94A3B8]">Demo/Free</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">25%</p>
            <p className="text-xs text-[#94A3B8]">Starter</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">30%</p>
            <p className="text-xs text-[#94A3B8]">Professional</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#F1F5F9]">35%</p>
            <p className="text-xs text-[#94A3B8]">Enterprise</p>
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-sm text-[#64748B]">
        Upgrade your plan to earn higher commissions
      </p>

      {/* Commission Offers */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-4">Available Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{offer.software_icon}</span>
                    <div>
                      <h3 className="font-bold text-[#F1F5F9]">{offer.software_name}</h3>
                      <p className="text-sm text-[#64748B]">{offer.pricing}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">
                    {offer.commission_type === 'percentage' 
                      ? `${offer.commission_amount}%` 
                      : `$${offer.commission_amount}`}
                  </Badge>
                </div>

                <p className="text-[#94A3B8] mb-4">{offer.description}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#2A2D38]"
                    onClick={() => copyTag(offer.system_tag)}
                  >
                    {copiedTag === offer.system_tag ? (
                      <><Check className="h-4 w-4 mr-2" /> Copied</>
                    ) : (
                      <><Tag className="h-4 w-4 mr-2" /> {offer.system_tag}</>
                    )}
                  </Button>
                  <Button
                    className="flex-1 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                    onClick={() => window.open(offer.sales_page_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    See Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">How to Earn Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5B4FFF]/20 text-[#5B4FFF] flex items-center justify-center mx-auto mb-2 font-bold">1</div>
              <p className="text-sm text-[#94A3B8]">Capture lead in FunnelSwift</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5B4FFF]/20 text-[#5B4FFF] flex items-center justify-center mx-auto mb-2 font-bold">2</div>
              <p className="text-sm text-[#94A3B8]">Tag with system tag (e.g., ada-lead-magnet)</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5B4FFF]/20 text-[#5B4FFF] flex items-center justify-center mx-auto mb-2 font-bold">3</div>
              <p className="text-sm text-[#94A3B8]">Prospect upgrades to paid</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#5B4FFF]/20 text-[#5B4FFF] flex items-center justify-center mx-auto mb-2 font-bold">4</div>
              <p className="text-sm text-[#94A3B8]">You earn commission!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      {!isAffiliate && (
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">Ready to start earning?</h3>
          <p className="text-[#94A3B8] mb-4">Join our affiliate program and earn 30-50% commissions</p>
          <Link href="/affiliate/apply">
            <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
              Become an Affiliate
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
