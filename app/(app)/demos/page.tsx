'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone,
  Eye,
  Bot,
  Search,
  Zap,
  AlertTriangle,
} from 'lucide-react';

const demoTypes = [
  {
    id: 'demo_missed_call',
    title: 'Missed Call Text Back',
    description: 'Auto-reply to missed calls with a text message',
    icon: Phone,
    color: 'from-[#F59E0B] to-[#EF4444]',
    fields: ['phone'],
  },
  {
    id: 'demo_ada',
    title: 'ADA Compliance Scan',
    description: 'Website accessibility audit demo',
    icon: Eye,
    color: 'from-[#EF4444] to-[#F97316]',
    fields: ['website', 'email'],
  },
  {
    id: 'demo_ai',
    title: 'AI Agent Demo',
    description: 'Conversational AI assistant demo',
    icon: Bot,
    color: 'from-[#5B4FFF] to-[#8B5CF6]',
    fields: ['email', 'phone'],
  },
  {
    id: 'demo_research',
    title: 'Lead Research Agent',
    description: 'AI-powered lead research and enrichment',
    icon: Search,
    color: 'from-[#22C55E] to-[#10B981]',
    fields: ['website', 'email'],
  },
];

export default function DemosPage() {
  const [selectedDemo, setSelectedDemo] = useState<typeof demoTypes[0] | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const handleTriggerDemo = async () => {
    if (!selectedDemo) return;

    setIsSubmitting(true);
    try {
      // First create/get contact
      let contactId: string;

      const existingContact = await supabase
        .from('contacts')
        .select('id')
        .or(`email.eq.${email},phone.eq.${phone}`)
        .maybeSingle();

      if (existingContact.data) {
        contactId = existingContact.data.id;
      } else {
        const newContact = await supabase
          .from('contacts')
          .insert({
            email: email || null,
            phone: phone || null,
            source: selectedDemo.id,
            status: 'new',
          })
          .select()
          .single();
        contactId = newContact.data.id;
      }

      // Create event
      await supabase.from('events').insert({
        contact_id: contactId,
        event_type: 'demo_viewed',
        source_app: 'demo_trigger',
        payload: {
          demo_type: selectedDemo.id,
          triggered_manually: true,
        },
      });

      toast.success('Demo triggered successfully');
      setSelectedDemo(null);
      setPhone('');
      setEmail('');
      setWebsite('');
    } catch (error) {
      console.error('Error triggering demo:', error);
      toast.error('Failed to trigger demo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Demo Triggers</h1>
        <p className="text-[#64748B] mt-1">
          Manually trigger demo events for testing and simulation
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-[#5B4FFF]/10 border-[#5B4FFF]/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#5B4FFF] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#F1F5F9] font-medium">Demo Mode</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              These triggers simulate demo completion events that would normally come from your
              product demos. In production, these events are fired automatically by the demo apps.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demoTypes.map((demo) => (
          <Card
            key={demo.id}
            className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-all cursor-pointer group"
            onClick={() => setSelectedDemo(demo)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${demo.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <demo.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#F1F5F9]">{demo.title}</h3>
                  <p className="text-sm text-[#64748B] mt-1">{demo.description}</p>
                  <Button
                    className="mt-4 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDemo(demo);
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Trigger Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Dialog */}
      <Dialog open={!!selectedDemo} onOpenChange={() => setSelectedDemo(null)}>
        <DialogContent className="bg-[#16181D] border-[#2A2D38] text-[#F1F5F9]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDemo && (
                <>
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedDemo.color} flex items-center justify-center`}
                  >
                    <selectedDemo.icon className="h-4 w-4 text-white" />
                  </div>
                  {selectedDemo.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              {selectedDemo?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDemo?.fields.includes('phone') && (
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+15551234567"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
              </div>
            )}

            {selectedDemo?.fields.includes('email') && (
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
              </div>
            )}

            {selectedDemo?.fields.includes('website') && (
              <div>
                <label className="text-sm text-[#94A3B8] block mb-1.5">Website URL</label>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setSelectedDemo(null)}
              className="flex-1 border-[#2A2D38] text-[#F1F5F9]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTriggerDemo}
              className="flex-1 bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Triggering...' : 'Trigger Demo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
