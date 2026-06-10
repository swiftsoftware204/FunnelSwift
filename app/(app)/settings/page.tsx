'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Key,
  Bell,
  Globe,
  Database,
  Settings as SettingsIcon,
  ExternalLink,
  Check,
  X,
  Lock,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Settings</h1>
        <p className="text-[#64748B] mt-1">Configure your Lead Capture BOS</p>
      </div>

      {/* Security Settings */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#5B4FFF]" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[#64748B]" />
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Content Security Policy</p>
                <p className="text-xs text-[#64748B]">CSP headers are enforced</p>
              </div>
            </div>
            <Badge className="bg-[#22C55E]/20 text-[#22C55E]">
              <Check className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#64748B]" />
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Row Level Security</p>
                <p className="text-xs text-[#64748B]">All database tables have RLS enabled</p>
              </div>
            </div>
            <Badge className="bg-[#22C55E]/20 text-[#22C55E]">
              <Check className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-[#64748B]" />
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">API Key Authentication</p>
                <p className="text-xs text-[#64748B]">All /api/v1/* routes require Bearer token</p>
              </div>
            </div>
            <Badge className="bg-[#22C55E]/20 text-[#22C55E]">
              <Check className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#F59E0B]" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Twilio */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Twilio</p>
                <p className="text-xs text-[#64748B]">SMS capture and notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#22C55E]/20 text-[#22C55E]">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
              <Button variant="ghost" size="sm" className="text-[#5B4FFF]">
                Configure
              </Button>
            </div>
          </div>

          {/* PostHog */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">PostHog</p>
                <p className="text-xs text-[#64748B]">Product analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#22C55E]/20 text-[#22C55E]">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
              <Button variant="ghost" size="sm" className="text-[#5B4FFF]">
                Configure
              </Button>
            </div>
          </div>

          {/* n8n */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E0F12]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">n8n</p>
                <p className="text-xs text-[#64748B]">Automation workflows via webhooks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#64748B]/20 text-[#64748B]">
                <X className="h-3 w-3 mr-1" /> Not connected
              </Badge>
              <Button variant="ghost" size="sm" className="text-[#5B4FFF]">
                Setup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Info */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#22C55E]" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#2A2D38]">
            <div className="flex items-center justify-between">
              <div>
                <code className="text-sm text-[#22C55E]">POST /api/v1/leads</code>
                <p className="text-xs text-[#64748B] mt-1">Create or update a lead</p>
              </div>
              <Badge variant="outline" className="text-xs border-[#F59E0B] text-[#F59E0B]">
                leads:write
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#2A2D38]">
            <div className="flex items-center justify-between">
              <div>
                <code className="text-sm text-[#22C55E]">GET /api/v1/leads/:id</code>
                <p className="text-xs text-[#64748B] mt-1">Get a single lead</p>
              </div>
              <Badge variant="outline" className="text-xs border-[#3B82F6] text-[#3B82F6]">
                leads:read
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#2A2D38]">
            <div className="flex items-center justify-between">
              <div>
                <code className="text-sm text-[#22C55E]">POST /api/v1/events</code>
                <p className="text-xs text-[#64748B] mt-1">Log an event</p>
              </div>
              <Badge variant="outline" className="text-xs border-[#EF4444] text-[#EF4444]">
                events:write
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#2A2D38]">
            <div className="flex items-center justify-between">
              <div>
                <code className="text-sm text-[#22C55E]">GET /api/v1/health</code>
                <p className="text-xs text-[#64748B] mt-1">Health check endpoint</p>
              </div>
              <Badge variant="outline" className="text-xs border-[#22C55E] text-[#22C55E]">
                public
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4 border-[#2A2D38] text-[#F1F5F9]">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full API Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
