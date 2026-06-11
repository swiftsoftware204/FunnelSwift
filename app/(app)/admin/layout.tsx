'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is superadmin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_superadmin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_superadmin) {
        toast.error('Access denied. Admin only.');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin:', error);
      router.push('/dashboard');
    }
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0E0F12] flex items-center justify-center">
        <div className="text-[#64748B]">Checking permissions...</div>
      </div>
    );
  }

  return <>{children}</>;
}
