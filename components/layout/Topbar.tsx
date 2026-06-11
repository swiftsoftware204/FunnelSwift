'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChannelStatusBar } from '@/components/layout/ChannelStatusBar';
import Link from 'next/link';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-16 bg-[#16181D] border-b border-[#2A2D38] flex items-center justify-between px-6 pl-16 lg:pl-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-[#F1F5F9]">{title || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ChannelStatusBar />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <Input
            placeholder="Search leads..."
            className="pl-10 w-64 bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] placeholder:text-[#64748B]"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#94A3B8] hover:text-[#F1F5F9]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444]" />
        </Button>

        <Link href="/profile">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#94A3B8] hover:text-[#F1F5F9]"
          >
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
