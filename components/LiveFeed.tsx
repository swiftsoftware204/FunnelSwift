'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

interface Event {
  id: string
  event_type: string
  source_app: string
  payload: any
  created_at: string
  contacts?: {
    first_name?: string
    last_name?: string
    email?: string
    business_name?: string
  }
}

export function LiveFeed() {
  const [events, setEvents] = useState<Event[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Fetch initial events
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*, contacts(first_name, last_name, email, business_name)')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (data) {
        setEvents(data)
      }
    }

    fetchEvents()

    // Subscribe to realtime events
    const subscription = supabase
      .channel('events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
      }, (payload) => {
        const newEvent = payload.new as Event
        setEvents((prev) => [newEvent, ...prev.slice(0, 19)])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      lead_created: 'bg-green-500',
      form_submitted: 'bg-blue-500',
      demo_viewed: 'bg-purple-500',
      tag_applied: 'bg-yellow-500',
      stage_changed: 'bg-orange-500',
      score_updated: 'bg-pink-500',
    }
    return colors[eventType] || 'bg-gray-500'
  }

  const getEventLabel = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${getEventColor(event.event_type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getEventLabel(event.event_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 truncate">
                    {event.contacts?.business_name || 
                     `${event.contacts?.first_name || ''} ${event.contacts?.last_name || ''}`.trim() ||
                     event.contacts?.email ||
                     'Unknown contact'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    via {event.source_app}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
