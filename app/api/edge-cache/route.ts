export const runtime = 'edge'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  
  if (!key) {
    return new Response('Key required', { status: 400 })
  }

  // Edge cache - fastest possible response
  const cache = await caches.open('funnelswift-cache')
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }

  // Fetch fresh data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/${key}`)
  const data = await response.json()

  // Store in edge cache (5 minutes)
  const cacheResponse = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
  
  await cache.put(request, cacheResponse.clone())
  
  return cacheResponse
}
