'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Key, Webhook, Shield } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">System Settings</h1>
        <p className="text-[#94A3B8] mt-1">
          Manage domains, API keys, and webhooks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#5B4FFF]" />
              System Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Default Domain</label>
              <Input
                value="go.funnelswift.com"
                readOnly
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              Manage Domains →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Key className="h-5 w-5 text-[#5B4FFF]" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Supabase Anon Key</label>
              <Input
                type="password"
                value="••••••••••••••••"
                readOnly
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              Manage API Keys →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Webhook className="h-5 w-5 text-[#5B4FFF]" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Webhook URL</label>
              <Input
                value="https://funnelswift.netlify.app/api/webhooks"
                readOnly
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              Configure Webhooks →
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#5B4FFF]" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Webhook Secret</label>
              <Input
                type="password"
                value="••••••••••••••••"
                readOnly
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
            <Button variant="outline" className="w-full border-[#2A2D38]">
              Security Settings →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
