'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Upload, Check, Download, AlertCircle } from 'lucide-react';

export default function AffiliateTaxDocumentsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [taxInfo, setTaxInfo] = useState({
    legal_name: '',
    business_name: '',
    tax_id_type: 'ssn', // 'ssn' or 'ein'
    tax_id: '',
    entity_type: 'individual', // 'individual', 'llc', 'corporation', 'partnership'
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    signature: '',
    date_signed: '',
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTaxInfo();
  }, []);

  async function loadTaxInfo() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('affiliate_profiles')
        .select('*, tax_info:affiliate_tax_info(*)')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (profileData.tax_info) {
          setTaxInfo(profileData.tax_info);
          setHasSubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error loading tax info:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitW9() {
    // Validate required fields
    if (!taxInfo.legal_name || !taxInfo.tax_id || !taxInfo.address || !taxInfo.signature) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('affiliate_tax_info')
        .upsert({
          affiliate_id: profile.id,
          user_id: user.id,
          ...taxInfo,
          date_signed: new Date().toISOString(),
          w9_status: 'submitted',
        });

      if (error) throw error;

      toast.success('W-9 submitted successfully!');
      setHasSubmitted(true);
    } catch (error) {
      toast.error('Failed to submit W-9');
    }
  }

  function downloadW9PDF() {
    // In production, generate actual PDF
    toast.info('W-9 PDF download coming soon!');
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-[#64748B]">Please apply to become an affiliate first.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Tax Documents</h1>
        <p className="text-[#94A3B8] mt-1">
          Submit your W-9 form to receive commission payments
        </p>
      </div>

      {hasSubmitted ? (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#F1F5F9]">W-9 Submitted</h3>
                <p className="text-sm text-[#94A3B8]">
                  Signed on {new Date(taxInfo.date_signed).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-[#94A3B8] text-sm mb-4">
              Your tax information is on file. You'll receive a 1099-NEC at the end of the year 
              if your commissions exceed $600.
            </p>
            <Button variant="outline" className="border-[#2A2D38]" onClick={downloadW9PDF}>
              <Download className="h-4 w-4 mr-2" />
              Download Copy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm text-[#F1F5F9]">
                  <strong>Required:</strong> You must submit a W-9 form before receiving any commission payments.
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  This information is kept secure and used for tax reporting purposes only.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#5B4FFF]" />
                W-9 Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Legal Name *</label>
                <Input
                  value={taxInfo.legal_name}
                  onChange={(e) => setTaxInfo({ ...taxInfo, legal_name: e.target.value })}
                  placeholder="As shown on your tax return"
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>

              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Business Name (if different)</label>
                <Input
                  value={taxInfo.business_name}
                  onChange={(e) => setTaxInfo({ ...taxInfo, business_name: e.target.value })}
                  placeholder="Leave blank if using personal name"
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Entity Type *</label>
                  <Select
                    value={taxInfo.entity_type}
                    onValueChange={(value) => setTaxInfo({ ...taxInfo, entity_type: value })}
                  >
                    <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                      <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Tax ID Type *</label>
                  <Select
                    value={taxInfo.tax_id_type}
                    onValueChange={(value) => setTaxInfo({ ...taxInfo, tax_id_type: value })}
                  >
                    <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                      <SelectItem value="ssn">SSN (Social Security Number)</SelectItem>
                      <SelectItem value="ein">EIN (Employer ID Number)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">
                  {taxInfo.tax_id_type === 'ssn' ? 'Social Security Number *' : 'EIN *'}
                </label>
                <Input
                  type="password"
                  value={taxInfo.tax_id}
                  onChange={(e) => setTaxInfo({ ...taxInfo, tax_id: e.target.value })}
                  placeholder={taxInfo.tax_id_type === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>

              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Address *</label>
                <Input
                  value={taxInfo.address}
                  onChange={(e) => setTaxInfo({ ...taxInfo, address: e.target.value })}
                  placeholder="Street address"
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">City *</label>
                  <Input
                    value={taxInfo.city}
                    onChange={(e) => setTaxInfo({ ...taxInfo, city: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">State *</label>
                  <Input
                    value={taxInfo.state}
                    onChange={(e) => setTaxInfo({ ...taxInfo, state: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">ZIP *</label>
                  <Input
                    value={taxInfo.zip}
                    onChange={(e) => setTaxInfo({ ...taxInfo, zip: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                </div>
              </div>

              <div className="border-t border-[#2A2D38] pt-4 mt-4">
                <p className="text-sm text-[#94A3B8] mb-4">
                  Under penalties of perjury, I certify that:
                  <br />1. The number shown is my correct taxpayer identification number
                  <br />2. I am not subject to backup withholding
                  <br />3. I am a U.S. citizen or other U.S. person
                </p>

                <div>
                  <label className="text-sm text-[#F1F5F9] mb-1 block">Electronic Signature *</label>
                  <Input
                    value={taxInfo.signature}
                    onChange={(e) => setTaxInfo({ ...taxInfo, signature: e.target.value })}
                    placeholder="Type your full name to sign"
                    className="bg-[#0E0F12] border-[#2A2D38]"
                  />
                  <p className="text-xs text-[#64748B] mt-1">
                    By typing your name, you agree this constitutes your electronic signature
                  </p>
                </div>
              </div>

              <Button 
                className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                onClick={submitW9}
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit W-9 Form
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
