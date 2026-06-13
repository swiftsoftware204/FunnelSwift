import { createClient } from '@supabase/supabase-js'

const sourceScores: Record<string, number> = {
  demo_missed_call: 20,
  demo_ada: 18,
  demo_ai: 18,
  sms: 15,
  form: 12,
  cold_email: 10,
  fb_ad: 8,
  manual: 5,
  qr: 5,
  external_api: 5,
}

export interface Contact {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  business_name?: string
  website?: string
  source: string
  created_at: string
  lead_score?: number
}

export interface Event {
  event_type: string
  created_at: string
}

export function calculateLeadScore(contact: Contact, events: Event[]): number {
  let score = 0

  // Source quality
  score += sourceScores[contact.source] ?? 5

  // Engagement signals
  const demoViewed = events.some(e => e.event_type === 'demo_viewed')
  const repliedToSMS = events.some(e => e.event_type === 'sms_reply')
  const formComplete = events.some(e => e.event_type === 'form_submitted')
  
  if (demoViewed) score += 20
  if (repliedToSMS) score += 15
  if (formComplete) score += 10

  // Data completeness
  if (contact.email) score += 5
  if (contact.phone) score += 5
  if (contact.business_name) score += 3
  if (contact.website) score += 2

  // Recency (decay past 30 days)
  const daysSinceCreated = (Date.now() - new Date(contact.created_at).getTime()) / 86400000
  if (daysSinceCreated > 30) score = Math.floor(score * 0.7)
  if (daysSinceCreated > 60) score = Math.floor(score * 0.5)

  return Math.min(100, score)
}

export function getLeadTier(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot'
  if (score >= 45) return 'warm'
  return 'cold'
}

export async function updateLeadScore(supabase: any, contactId: string): Promise<number> {
  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    console.error('Error fetching contact:', contactError)
    return 0
  }

  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('event_type, created_at')
    .eq('contact_id', contactId)

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
    return 0
  }

  // Calculate new score
  const newScore = calculateLeadScore(contact, events || [])

  // Update contact
  const { error: updateError } = await supabase
    .from('contacts')
    .update({ lead_score: newScore })
    .eq('id', contactId)

  if (updateError) {
    console.error('Error updating lead score:', updateError)
  }

  return newScore
}
