'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0F12] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-4">FunnelSwift</h1>
        <p className="text-[#64748B]">Loading...</p>
      </div>
    </div>
  );
}
