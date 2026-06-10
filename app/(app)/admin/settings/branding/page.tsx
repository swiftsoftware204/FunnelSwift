'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Palette, Image, Type } from 'lucide-react';

interface BrandingSettings {
  logo_url: string;
  logo_dark_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string;
}

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<BrandingSettings>({
    logo_url: '',
    logo_dark_url: '',
    primary_color: '#5B4FFF',
    secondary_color: '#16181D',
    accent_color: '#22C55E',
    font_family: 'Inter',
    custom_css: '',
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
        .eq('key', 'branding')
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
          key: 'branding',
          value: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Branding settings saved!');
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
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Branding</h1>
        <p className="text-[#94A3B8] mt-1">
          Customize your platform appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Image className="h-5 w-5 text-[#5B4FFF]" />
              Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Logo URL (Light Mode)</label>
              <Input
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://yoursite.com/logo.png"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo preview" 
                  className="h-12 mt-2 bg-white rounded p-2"
                />
              )}
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Logo URL (Dark Mode)</label>
              <Input
                value={settings.logo_dark_url}
                onChange={(e) => setSettings({ ...settings, logo_dark_url: e.target.value })}
                placeholder="https://yoursite.com/logo-white.png"
                className="bg-[#0E0F12] border-[#2A2D38]"
              />
              {settings.logo_dark_url && (
                <img 
                  src={settings.logo_dark_url} 
                  alt="Logo dark preview" 
                  className="h-12 mt-2 bg-[#16181D] rounded p-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#5B4FFF]" />
              Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Primary Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-10 p-1 bg-[#0E0F12] border-[#2A2D38]"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Secondary Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="w-12 h-10 p-1 bg-[#0E0F12] border-[#2A2D38]"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="flex-1 bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Accent Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="w-12 h-10 p-1 bg-[#0E0F12] border-[#2A2D38]"
                />
                <Input
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="flex-1 bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Type className="h-5 w-5 text-[#5B4FFF]" />
              Typography
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#F1F5F9] mb-1 block">Font Family</label>
              <select
                value={settings.font_family}
                onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]"
              >
                <option value="Inter">Inter (Modern)</option>
                <option value="Roboto">Roboto (Clean)</option>
                <option value="Open Sans">Open Sans (Friendly)</option>
                <option value="Poppins">Poppins (Bold)</option>
                <option value="Montserrat">Montserrat (Professional)</option>
              </select>
            </div>

            <div className="p-4 bg-[#0E0F12] rounded border border-[#2A2D38]">
              <p style={{ fontFamily: settings.font_family }} className="text-[#F1F5F9] text-lg">
                The quick brown fox jumps over the lazy dog
              </p>
              <p style={{ fontFamily: settings.font_family }} className="text-[#94A3B8] text-sm mt-2">
                Preview of {settings.font_family}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9]">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border border-[#2A2D38]"
              style={{ backgroundColor: settings.secondary_color }}
            >
              <div className="flex items-center gap-3 mb-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-8" />
                ) : (
                  <div 
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                )}
                <span style={{ fontFamily: settings.font_family }} className="text-[#F1F5F9] font-bold">
                  Your Brand
                </span>
              </div>
              <Button
                style={{ 
                  backgroundColor: settings.primary_color,
                  fontFamily: settings.font_family 
                }}
              >
                Primary Button
              </Button>
              <Button
                className="ml-2"
                style={{ 
                  backgroundColor: settings.accent_color,
                  fontFamily: settings.font_family 
                }}
              >
                Accent Button
              </Button>
            </div>
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
