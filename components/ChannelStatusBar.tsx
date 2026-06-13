'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  FormInput, 
  QrCode, 
  Mail, 
  Smartphone,
  Bot,
  Accessibility,
  PhoneMissed
} from 'lucide-react'

interface ChannelStatus {
  id: string
  name: string
  icon: React.ReactNode
  isActive: boolean
  count: number
}

export function ChannelStatusBar() {
  const [channels, setChannels] = useState<ChannelStatus[]>([
    { id: 'web', name: 'Web Forms', icon: <FormInput className="w-4 h-4" />, isActive: true, count: 0 },
    { id: 'qr', name: 'QR Codes', icon: <QrCode className="w-4 h-4" />, isActive: true, count: 0 },
    { id: 'email', name: 'Cold Email', icon: <Mail className="w-4 h-4" />, isActive: true, count: 0 },
    { id: 'sms', name: 'SMS', icon: <Smartphone className="w-4 h-4" />, isActive: false, count: 0 },
    { id: 'ai', name: 'AI Agent', icon: <Bot className="w-4 h-4" />, isActive: true, count: 0 },
    { id: 'ada', name: 'ADA Widget', icon: <Accessibility className="w-4 h-4" />, isActive: true, count: 0 },
    { id: 'missed_call', name: 'Missed Call', icon: <PhoneMissed className="w-4 h-4" />, isActive: true, count: 0 },
  ])

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCounts = async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('contacts')
        .select('source')
        .gte('created_at', today)

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach(contact => {
          counts[contact.source] = (counts[contact.source] || 0) + 1
        })

        setChannels(prev => prev.map(channel => ({
          ...channel,
          count: counts[channel.id] || 0
        })))
      }
    }

    fetchCounts()

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [supabase])

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mr-4">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Capture Channels</span>
      </div>
      
      {channels.map(channel => (
        <Badge
          key={channel.id}
          variant={channel.isActive ? 'default' : 'secondary'}
          className={`flex items-center gap-1.5 ${
            channel.isActive 
              ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
              : 'bg-gray-500/10 text-gray-600'
          }`}
        >
          {channel.icon}
          <span className="hidden sm:inline">{channel.name}</span>
          <span className="sm:hidden">{channel.id}</span>
          {channel.count > 0 && (
            <span className="ml-1 text-xs bg-background/50 px-1.5 rounded">
              {channel.count}
            </span>
          )}
          {channel.isActive && (
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
          )}
        </Badge>
      ))}
    </div>
  )
}
