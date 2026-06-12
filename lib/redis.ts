import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache helpers
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data as T
  } catch {
    return null
  }
}

export async function setCache(key: string, data: any, ttlSeconds = 3600) {
  try {
    await redis.set(key, data, { ex: ttlSeconds })
  } catch (e) {
    console.error('Cache set error:', e)
  }
}

export async function deleteCache(key: string) {
  try {
    await redis.del(key)
  } catch {}
}

// Cache keys
export const cacheKeys = {
  listing: (id: string) => `listing:${id}`,
  directory: (slug: string) => `dir:${slug}`,
  search: (query: string) => `search:${query}`,
  analytics: (dirId: string) => `analytics:${dirId}`,
  user: (id: string) => `user:${id}`,
}
