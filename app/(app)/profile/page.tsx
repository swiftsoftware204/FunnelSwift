'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Mail, Building, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.full_name || '',
          company: user.user_metadata?.company || '',
        }));
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          company: formData.company,
        }
      });
      
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      
      if (error) throw error;
      toast.success('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Failed to sign out');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">My Profile</h1>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <User className="h-5 w-5 text-[#5B4FFF]" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Email</Label>
                <div className="flex items-center gap-2 p-3 bg-[#0E0F12] rounded-lg border border-[#2A2D38]">
                  <Mail className="h-4 w-4 text-[#64748B]" />
                  <span className="text-[#F1F5F9]">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#94A3B8]">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#94A3B8]">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] pl-10"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={updating}
                className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#5B4FFF]" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#94A3B8]">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#94A3B8]">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                type="submit" 
                disabled={updating}
                className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              >
                {updating ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b border-[#2A2D38]">
            <span className="text-[#64748B]">User ID</span>
            <span className="text-[#F1F5F9] font-mono text-sm">{user?.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#2A2D38]">
            <span className="text-[#64748B]">Created</span>
            <span className="text-[#F1F5F9]">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#64748B]">Last Sign In</span>
            <span className="text-[#F1F5F9]">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
