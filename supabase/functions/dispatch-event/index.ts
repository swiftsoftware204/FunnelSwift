import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// HMAC signature generation
function generateHmac(secret: string, payload: string): string {
  const encoder = new TextEncoder()
  const key = encoder.encode(secret)
  const data = encoder.encode(payload)
  
  return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(key => crypto.subtle.sign('HMAC', key, data))
    .then(signature => btoa(String.fromCharCode(...new Uint8Array(signature))))
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { event } = await req.json()

    // Find matching webhook configs
    const { data: configs, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('is_active', true)
      .contains('event_types', [event.event_type])

    if (configError) {
      console.error('Error fetching webhook configs:', configError)
      return new Response(JSON.stringify({ error: configError.message }), { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ dispatched_to: 0 }), { status: 200 })
    }

    // Dispatch to all matching webhooks in parallel
    const dispatchPromises = configs.map(async (config) => {
      try {
        const payload = JSON.stringify({ event, contact_id: event.contact_id })
        const signature = config.secret 
          ? await generateHmac(config.secret, payload)
          : undefined

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-SI-Signature': signature }),
            'X-SI-Event': event.event_type,
            'X-SI-Source': event.source_app || 'funnelswift',
          },
          body: payload,
        })

        return {
          webhook_id: config.id,
          success: response.ok,
          status: response.status,
        }
      } catch (error) {
        console.error(`Webhook dispatch failed for ${config.id}:`, error)
        return {
          webhook_id: config.id,
          success: false,
          error: error.message,
        }
      }
    })

    const results = await Promise.allSettled(dispatchPromises)
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    return new Response(
      JSON.stringify({ 
        dispatched_to: configs.length,
        successful,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dispatch error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
