'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Step 2: Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_superadmin')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile?.is_superadmin) {
        // Not an admin, sign them out
        await supabase.auth.signOut();
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      // Step 3: Redirect to admin dashboard
      toast.success('Welcome, Admin!');
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0F12] via-[#16181D] to-[#1e2128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#16181D]/80 border-[#2A2D38] backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F1F5F9]">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-[#64748B]">
            Super Admin Access Only
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] h-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] h-11"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#5B4FFF] to-[#8B5CF6] hover:opacity-90 h-11"
            >
              {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2A2D38] text-center">
            <p className="text-sm text-[#64748B] mb-2">Not an admin?</p>
            <Link href="/login">
              <Button variant="outline" className="w-full border-[#2A2D38] text-[#F1F5F9]">
                Go to Tenant Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
