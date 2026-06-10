'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

export function AffiliateBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
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
        .select('status')
        .eq('user_id', user.id)
        .single();

      setIsAffiliate(profile?.status === 'approved');
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Don't show if already affiliate or loading
  if (isLoading || isAffiliate || !isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-[#5B4FFF]/20 to-[#5B4FFF]/10 border-[#5B4FFF]/30 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5B4FFF]/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-[#5B4FFF]" />
            </div>
            <div>
              <h3 className="font-medium text-[#F1F5F9]">
                Earn 30% Commission
              </h3>
              <p className="text-sm text-[#94A3B8]">
                Refer others to FunnelSwift and earn recurring commissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/affiliate/apply">
              <Button 
                size="sm" 
                className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              >
                <Users className="h-4 w-4 mr-2" />
                Become an Affiliate
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#64748B] hover:text-[#F1F5F9]"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
