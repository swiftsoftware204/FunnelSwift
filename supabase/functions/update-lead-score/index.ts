import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

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

function calculateLeadScore(contact: any, events: any[]): number {
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { contact_id } = await req.json()

    if (!contact_id) {
      return new Response(JSON.stringify({ error: 'contact_id required' }), { status: 400 })
    }

    // Fetch contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404 })
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('event_type, created_at')
      .eq('contact_id', contact_id)

    if (eventsError) {
      return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 })
    }

    // Calculate new score
    const newScore = calculateLeadScore(contact, events || [])

    // Update contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ lead_score: newScore })
      .eq('id', contact_id)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    // Fire score_updated event
    await supabase.from('events').insert({
      contact_id,
      event_type: 'score_updated',
      source_app: 'scoring_engine',
      payload: { previous_score: contact.lead_score, new_score: newScore }
    })

    return new Response(
      JSON.stringify({ 
        contact_id, 
        score: newScore,
        tier: newScore >= 70 ? 'hot' : newScore >= 45 ? 'warm' : 'cold'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Scoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
