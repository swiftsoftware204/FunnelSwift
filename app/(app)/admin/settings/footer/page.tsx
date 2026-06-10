'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Layout, Plus, Trash2, GripVertical, Save } from 'lucide-react';

interface FooterLink {
  id: string;
  label: string;
  url: string;
  column_number: number;
  sort_order: number;
  link_type: string;
  is_active: boolean;
}

export default function FooterManagementPage() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .order('column_number', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading footer links:', error);
      toast.error('Failed to load footer links');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveLinks() {
    setIsSaving(true);
    try {
      // Update all links
      for (const link of links) {
        const { error } = await supabase
          .from('footer_links')
          .upsert({
            id: link.id || undefined,
            label: link.label,
            url: link.url,
            column_number: link.column_number,
            sort_order: link.sort_order,
            link_type: link.link_type,
            is_active: link.is_active,
          });

        if (error) throw error;
      }

      toast.success('Footer saved successfully!');
    } catch (error) {
      toast.error('Failed to save footer');
    } finally {
      setIsSaving(false);
    }
  }

  function addLink(column: number) {
    const newLink: FooterLink = {
      id: '',
      label: 'New Link',
      url: '/',
      column_number: column,
      sort_order: links.filter(l => l.column_number === column).length,
      link_type: 'custom',
      is_active: true,
    };
    setLinks([...links, newLink]);
  }

  function updateLink(id: string, updates: Partial<FooterLink>) {
    setLinks(links.map(link => 
      link.id === id ? { ...link, ...updates } : link
    ));
  }

  function removeLink(id: string) {
    setLinks(links.filter(link => link.id !== id));
  }

  function moveLink(id: string, direction: 'up' | 'down') {
    const link = links.find(l => l.id === id);
    if (!link) return;

    const columnLinks = links.filter(l => l.column_number === link.column_number);
    const currentIndex = columnLinks.findIndex(l => l.id === id);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevLink = columnLinks[currentIndex - 1];
      updateLink(id, { sort_order: prevLink.sort_order });
      updateLink(prevLink.id, { sort_order: link.sort_order });
    } else if (direction === 'down' && currentIndex < columnLinks.length - 1) {
      const nextLink = columnLinks[currentIndex + 1];
      updateLink(id, { sort_order: nextLink.sort_order });
      updateLink(nextLink.id, { sort_order: link.sort_order });
    }
  }

  const columns = [1, 2, 3];
  const columnTitles = ['Product', 'Legal', 'Company'];

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Footer Management</h1>
        <Button 
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={saveLinks}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((columnNum) => (
          <Card key={columnNum} className="bg-[#16181D] border-[#2A2D38]">
            <CardHeader>
              <CardTitle className="text-[#F1F5F9]">
                Column {columnNum}: {columnTitles[columnNum - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {links
                .filter(link => link.column_number === columnNum)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((link) => (
                  <div 
                    key={link.id || Math.random()} 
                    className="p-3 bg-[#0E0F12] rounded-lg border border-[#2A2D38] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-[#64748B]" />
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(link.id, { label: e.target.value })}
                        placeholder="Link Label"
                        className="bg-[#16181D] border-[#2A2D38] flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        placeholder="URL"
                        className="bg-[#16181D] border-[#2A2D38] flex-1"
                      />
                      <Select
                        value={link.link_type}
                        onValueChange={(value) => updateLink(link.id, { link_type: value })}
                      >
                        <SelectTrigger className="w-[120px] bg-[#16181D] border-[#2A2D38]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              
              <Button
                variant="outline"
                className="w-full border-[#2A2D38] border-dashed"
                onClick={() => addLink(columnNum)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardContent className="p-4">
          <p className="text-sm text-[#94A3B8]">
            <strong className="text-[#F1F5F9]">Tip:</strong> Use relative URLs for internal pages 
            (e.g., <code>/pricing</code>) and full URLs for external links 
            (e.g., <code>https://example.com</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
