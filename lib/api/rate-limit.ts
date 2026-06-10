import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ApiError } from './auth';

// Fallback for when Redis is not configured
const fallbackLimit = new Map<string, { count: number; resetTime: number }>();

let ratelimit: Ratelimit | null = null;
let publicRatelimit: Ratelimit | null = null;

try {
  const redis = Redis.fromEnv();
  
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  });

  publicRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
  });
} catch {
  console.warn('Redis not configured, using in-memory rate limiting');
}

export async function rateLimit(identifier: string, isPublic = false): Promise<void> {
  // Use Redis if available
  if (ratelimit && publicRatelimit) {
    const limiter = isPublic ? publicRatelimit : ratelimit;
    const { success } = await limiter.limit(identifier);
    if (!success) throw new ApiError(429, 'Too many requests');
    return;
  }
  
  // Fallback to in-memory rate limiting
  const limit = isPublic ? 20 : 100;
  const windowMs = 60 * 1000; // 1 minute
  const now = Date.now();
  
  const record = fallbackLimit.get(identifier);
  
  if (!record || now > record.resetTime) {
    fallbackLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (record.count >= limit) {
    throw new ApiError(429, 'Too many requests');
  }
  
  record.count++;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of fallbackLimit.entries()) {
    if (now > record.resetTime) {
      fallbackLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);
