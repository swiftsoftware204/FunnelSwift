'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Globe, Image, Type } from 'lucide-react';

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_image_url: string;
  twitter_handle: string;
  favicon_url: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
}

export default function SEOSettingsPage() {
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: 'FunnelSwift - Lead Capture & CRM',
    site_description: 'Capture leads, manage contacts, and grow your business with FunnelSwift.',
    site_keywords: 'lead capture, CRM, marketing automation, sales funnel',
    og_image_url: '',
    twitter_handle: '',
    favicon_url: '/favicon.ico',
    google_analytics_id: '',
    facebook_pixel_id: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'seo')
        .single();

      if (data?.value) {
        setSettings({ ...settings, ...data.value });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'seo',
          value: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('SEO settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">SEO / Meta Settings</h1>
        <p className="text-[#94A3B8] mt-1">
          Manage site title, description, and social media metadata
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic SEO */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Type className="h-5 w-5 text-[#5B4FFF]" />
              Basic SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Site Title</label>
              <Input
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                placeholder="Your Site Title"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
              <p className="text-xs text-[#64748B] mt-1">
                Appears in browser tab and search results
              </p>
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Site Description</label>
              <Textarea
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                placeholder="Brief description of your site"
                className="bg-[#0E0F12] border-[#2A2D38] min-h-[80px]"
              />
              <p className="text-xs text-[#64748B] mt-1">
                Meta description for search engines (150-160 chars)
              </p>
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Keywords</label>
              <Input
                value={settings.site_keywords}
                onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
              <p className="text-xs text-[#64748B] mt-1">
                Comma-separated keywords for SEO
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#5B4FFF]" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Twitter Handle</label>
              <Input
                value={settings.twitter_handle}
                onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                placeholder="@yourhandle"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">OG Image URL</label>
              <Input
                value={settings.og_image_url}
                onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                placeholder="https://yoursite.com/og-image.jpg"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
              <p className="text-xs text-[#64748B] mt-1">
                Image shown when sharing on social media (1200x630px)
              </p>
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Favicon URL</label>
              <Input
                value={settings.favicon_url}
                onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                placeholder="/favicon.ico"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Image className="h-5 w-5 text-[#5B4FFF]" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Google Analytics ID</label>
              <Input
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Facebook Pixel ID</label>
              <Input
                value={settings.facebook_pixel_id}
                onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                placeholder="XXXXXXXXXXXXXXXX"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9]">Search Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-[#1a0dab] text-xl truncate hover:underline cursor-pointer">
                {settings.site_title}
              </div>
              <div className="text-[#006621] text-sm">
                https://funnelswift.com
              </div>
              <div className="text-[#545454] text-sm mt-1 line-clamp-2">
                {settings.site_description}
              </div>
            </div>
            <p className="text-xs text-[#64748B] mt-3">
              This is how your site appears in Google search results
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={saveSettings}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
