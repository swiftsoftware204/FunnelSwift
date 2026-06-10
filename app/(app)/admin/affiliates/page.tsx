'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, DollarSign, CheckCircle, XCircle, Search, Filter, Calendar } from 'lucide-react';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadAffiliates();
  }, []);

  async function loadAffiliates() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*, user:user_id(email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast.error('Failed to load affiliates');
    } finally {
      setIsLoading(false);
    }
  }

  async function approveAffiliate(id: string) {
    try {
      const { error } = await supabase
        .from('affiliate_profiles')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Affiliate approved');
      loadAffiliates();
    } catch (error) {
      toast.error('Failed to approve affiliate');
    }
  }

  async function rejectAffiliate(id: string) {
    try {
      const { error } = await supabase
        .from('affiliate_profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Affiliate rejected');
      loadAffiliates();
    } catch (error) {
      toast.error('Failed to reject affiliate');
    }
  }

  const filteredAffiliates = affiliates.filter(a => {
    const matchesSearch = a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.affiliate_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Note: Product and date filters would need additional data fetching
    // This is a simplified version - full implementation would query referral data
    return matchesSearch;
  });

  const pendingCount = affiliates.filter(a => a.status === 'pending').length;
  const totalCommissions = affiliates.reduce((sum, a) => sum + (a.total_commissions || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Affiliate Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Total Affiliates</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{affiliates.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {affiliates.filter(a => a.status === 'approved').length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-[#64748B]">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Total Commissions</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${totalCommissions.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="Search affiliates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <div>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded px-3 py-2 text-[#F1F5F9]"
              >
                <option value="all">All Products</option>
                <option value="adaswift">ADASwift</option>
                <option value="missedcall">MissedCall</option>
                <option value="workflowswift">WorkflowSwift</option>
                <option value="funnelswift">FunnelSwift</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded px-3 py-2 text-[#F1F5F9]"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded px-3 py-2 text-[#F1F5F9]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">All Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-[#64748B] py-4">Loading...</p>
          ) : filteredAffiliates.length === 0 ? (
            <p className="text-center text-[#64748B] py-4">No affiliates found</p>
          ) : (
            <div className="space-y-2">
              {filteredAffiliates.map((affiliate) => (
                <div key={affiliate.id} className="flex items-center justify-between p-4 bg-[#0E0F12] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#F1F5F9]">{affiliate.user?.email}</p>
                      <Badge variant={affiliate.status === 'approved' ? 'default' : 'secondary'}>
                        {affiliate.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#64748B]">
                      Code: {affiliate.affiliate_code} | 
                      Referrals: {affiliate.total_referrals || 0} | 
                      Earned: ${(affiliate.total_commissions || 0).toFixed(2)}
                    </p>
                  </div>
                  {affiliate.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveAffiliate(affiliate.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectAffiliate(affiliate.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
