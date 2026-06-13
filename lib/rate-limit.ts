import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// API key rate limit: 100 requests per minute
export const apiKeyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
})

// Public form rate limit: 20 requests per minute per IP
export const publicFormRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
})

// Webhook rate limit: 1000 requests per minute
export const webhookRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  analytics: true,
})

export async function rateLimit(identifier: string, type: 'api' | 'public' | 'webhook' = 'api') {
  const limiter = type === 'public' 
    ? publicFormRatelimit 
    : type === 'webhook' 
    ? webhookRatelimit 
    : apiKeyRatelimit

  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  return {
    success,
    limit,
    reset,
    remaining,
    error: success ? null : `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`,
  }
}
