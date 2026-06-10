'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Event, Contact } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, User, Phone, ArrowRightLeft } from 'lucide-react';

export default function SMSPage() {
  const [smsEvents, setSmsEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchSMSEvents() {
      setLoading(true);
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', 'sms_received')
        .order('created_at', { ascending: false })
        .limit(100);

      setSmsEvents(events || []);

      // Get unique contact IDs
      const contactIds = Array.from(new Set(events?.map((e) => e.contact_id).filter(Boolean)));
      if (contactIds.length > 0) {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('*')
          .in('id', contactIds);
        const contactMap: Record<string, Contact> = {};
        contactsData?.forEach((c) => {
          contactMap[c.id] = c;
        });
        setContacts(contactMap);
      }
      setLoading(false);
    }

    fetchSMSEvents();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F1F5F9]">SMS Capture</h1>
        <p className="text-[#64748B] mt-1">Inbound SMS messages from Twilio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Total SMS</p>
                <p className="text-2xl font-bold text-[#F1F5F9]">{smsEvents.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#F59E0B]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Unique Contacts</p>
                <p className="text-2xl font-bold text-[#F1F5F9]">{Object.keys(contacts).length}</p>
              </div>
              <User className="h-8 w-8 text-[#5B4FFF]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Today</p>
                <p className="text-2xl font-bold text-[#F1F5F9]">
                  {smsEvents.filter((e) => {
                    const today = new Date();
                    const eventDate = new Date(e.created_at);
                    return eventDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-[#22C55E]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-[#2A2D38] rounded-lg" />
              ))}
            </div>
          ) : smsEvents.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No SMS messages yet</p>
              <p className="text-sm mt-1">Messages will appear here when received via Twilio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {smsEvents.map((event) => {
                const contact = event.contact_id ? contacts[event.contact_id] : null;
                const payload = event.payload as {
                  from?: string;
                  to?: string;
                  body?: string;
                  message_sid?: string;
                };
                return (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 rounded-lg bg-[#0E0F12] border border-[#2A2D38]"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[#F1F5F9]">
                          {contact
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                              contact.phone
                            : payload.from || 'Unknown'}
                        </p>
                        <span className="text-xs text-[#64748B]">
                          {formatRelativeTime(event.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[#94A3B8] mt-1">{payload.body || 'No message content'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          From: {payload.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" />
                          To: {payload.to}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
