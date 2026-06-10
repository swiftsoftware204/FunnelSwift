'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLeadsStore } from '@/stores/leads.store';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  FormInput,
  MessageSquare,
  QrCode,
  Phone,
  Eye,
  Bot,
} from 'lucide-react';

const leadFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  business_name: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  source: z.enum(['form', 'sms', 'demo_missed_call', 'demo_ada', 'demo_ai', 'qr', 'cold_email', 'fb_ad', 'manual']),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export default function CapturePage() {
  const router = useRouter();
  const { tags, addLead } = useLeadsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      business_name: '',
      website: '',
      industry: '',
      source: 'manual',
      notes: '',
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name || null,
          email: data.email || null,
          phone: data.phone || null,
          business_name: data.business_name || null,
          website: data.website || null,
          industry: data.industry || null,
          source: data.source,
          notes: data.notes || null,
          status: 'new',
        })
        .select()
        .single();

      if (error) throw error;

      // Create event
      await supabase.from('events').insert({
        contact_id: contact.id,
        event_type: 'lead_created',
        source_app: 'manual_entry',
        payload: { source: data.source },
      });

      toast.success('Lead created successfully');
      router.push(`/leads/${contact.id}`);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const captureChannels = [
    {
      title: 'Web Forms',
      description: 'Custom landing pages for capturing leads',
      icon: FormInput,
      href: '/capture/forms',
      color: 'from-[#3B82F6] to-[#06B6D4]',
      count: 0,
    },
    {
      title: 'SMS Capture',
      description: 'Inbound SMS from Twilio',
      icon: MessageSquare,
      href: '/capture/sms',
      color: 'from-[#F59E0B] to-[#EF4444]',
      count: 0,
    },
    {
      title: 'QR Codes',
      description: 'Offline to online capture',
      icon: QrCode,
      href: '/capture/qr',
      color: 'from-[#8B5CF6] to-[#A855F7]',
      count: 0,
    },
    {
      title: 'Missed Call Demo',
      description: 'Auto-reply for missed calls',
      icon: Phone,
      href: '/demos',
      color: 'from-[#22C55E] to-[#10B981]',
      count: 0,
    },
    {
      title: 'ADA Scan Demo',
      description: 'Website accessibility audit',
      icon: Eye,
      href: '/demos',
      color: 'from-[#EF4444] to-[#F97316]',
      count: 0,
    },
    {
      title: 'AI Agent Demo',
      description: 'Conversational AI demo',
      icon: Bot,
      href: '/demos',
      color: 'from-[#5B4FFF] to-[#8B5CF6]',
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Capture</h1>
        <p className="text-[#64748B] mt-1">Add leads manually or manage capture channels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Add Form */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#5B4FFF]" />
              Quick Add Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94A3B8]">First Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                            placeholder="John"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94A3B8]">Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                            placeholder="Doe"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94A3B8]">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                            placeholder="john@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#94A3B8]">Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                            placeholder="+15551234567"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94A3B8]">Business Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]"
                          placeholder="Acme Inc"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94A3B8]">Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9]">
                            <SelectValue placeholder="Select a source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#16181D] border-[#2A2D38]">
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="form">Web Form</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="demo_ada">ADA Demo</SelectItem>
                          <SelectItem value="demo_ai">AI Agent</SelectItem>
                          <SelectItem value="demo_missed_call">Missed Call</SelectItem>
                          <SelectItem value="qr">QR Code</SelectItem>
                          <SelectItem value="cold_email">Cold Email</SelectItem>
                          <SelectItem value="fb_ad">Facebook Ad</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#94A3B8]">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-[#0E0F12] border-[#2A2D38] text-[#F1F5F9] min-h-[80px]"
                          placeholder="Additional notes..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Lead'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Capture Channels */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Capture Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {captureChannels.map((channel) => (
              <Card
                key={channel.title}
                className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer"
                onClick={() => router.push(channel.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center shrink-0`}
                    >
                      <channel.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#F1F5F9]">{channel.title}</h3>
                      <p className="text-sm text-[#64748B] mt-0.5">{channel.description}</p>
                      <p className="text-sm font-medium text-[#5B4FFF] mt-2">
                        {channel.count} leads
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CSV Import */}
          <Card className="bg-[#16181D] border-[#2A2D38] border-dashed">
            <CardContent className="p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-[#64748B] mb-3" />
              <h3 className="font-medium text-[#F1F5F9]">CSV Import</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Upload a CSV file to import multiple leads
              </p>
              <Button
                variant="outline"
                className="mt-4 border-[#2A2D38] text-[#F1F5F9] hover:bg-[#2A2D38]"
              >
                Upload CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
