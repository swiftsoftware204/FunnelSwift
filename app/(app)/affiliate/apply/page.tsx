'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, ArrowRight } from 'lucide-react';

export default function AffiliateApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState('');
  const supabase = createClient();

  async function handleApply() {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const affiliateCode = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const affiliateId = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase.from('affiliate_profiles').insert({
        user_id: user.id,
        affiliate_code: affiliateCode,
        affiliate_id: affiliateId,
        status: 'pending',
        payout_email: payoutEmail || user.email,
        referral_link: `https://funnelswift.com/?ref=${affiliateId}`
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Application submitted! We will review shortly.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Application Submitted!</h2>
            <p className="text-[#94A3B8] mb-6">
              We will review your application and email you within 24-48 hours.
            </p>
            <Button className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#5B4FFF]" />
            Become an Affiliate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-[#0E0F12] p-4 rounded-lg border border-[#2A2D38]">
            <h3 className="font-medium text-[#F1F5F9] mb-2">What you get:</h3>
            <ul className="space-y-2 text-[#94A3B8]">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
                30% recurring commission on all plans
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
                Unique referral link to share
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
                Real-time dashboard to track earnings
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5B4FFF]" />
                Monthly payouts via PayPal or bank transfer
              </li>
            </ul>
          </div>

          <div>
            <label className="text-sm font-medium text-[#F1F5F9]">
              Payout Email (PayPal or bank email)
            </label>
            <Input
              type="email"
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-[#0E0F12] border-[#2A2D38] mt-1"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Leave blank to use your account email
            </p>
          </div>

          <Button
            className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
            onClick={handleApply}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Apply Now'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
