'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for access_token in URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    if (!accessToken) {
      setError('Invalid or expired reset link');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0F12] via-[#16181D] to-[#1e2128] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#16181D]/80 border-[#2A2D38] backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-red-400">Invalid Link</CardTitle>
            <CardDescription className="text-[#64748B]">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login/forgot-password">
              <Button className="w-full bg-gradient-to-r from-[#5B4FFF] to-[#8B5CF6]">
                Request New Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0F12] via-[#16181D] to-[#1e2128] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#16181D]/80 border-[#2A2D38] backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#5B4FFF] to-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F1F5F9]">
            Reset Password
          </CardTitle>
          <CardDescription className="text-[#64748B]">
            Create a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-[#F1F5F9]">
                Password reset successful!
              </p>
              <p className="text-sm text-[#64748B]">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#64748B] mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Confirm Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#5B4FFF] to-[#8B5CF6] hover:opacity-90 h-11"
              >
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </Button>

              <Link href="/login">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[#64748B] hover:text-[#F1F5F9]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
