import NodeCache from 'node-cache';
import { ApiError } from './auth';

/**
 * In-memory rate limiting backed by node-cache.
 *
 * Each identifier is tracked within a fixed window; node-cache TTL handles
 * window expiry/cleanup automatically so there is no external dependency.
 * Suitable for single-instance deployments. For multi-instance horizontal
 * scaling, back this with a shared store (e.g. Upstash Redis).
 */

const WINDOW_SECONDS = 60;
const AUTHENTICATED_LIMIT = 100;
const PUBLIC_LIMIT = 20;

interface WindowRecord {
  count: number;
  reset: number; // epoch ms when the current window resets
}

const cache = new NodeCache({ stdTTL: WINDOW_SECONDS, checkperiod: WINDOW_SECONDS });

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function checkRateLimit(identifier: string, isPublic = false): RateLimitResult {
  const limit = isPublic ? PUBLIC_LIMIT : AUTHENTICATED_LIMIT;
  const key = `${isPublic ? 'pub' : 'api'}:${identifier}`;
  const now = Date.now();

  const existing = cache.get<WindowRecord>(key);

  if (!existing) {
    const reset = now + WINDOW_SECONDS * 1000;
    cache.set<WindowRecord>(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  if (existing.count >= limit) {
    return { success: false, limit, remaining: 0, reset: existing.reset };
  }

  existing.count += 1;
  const expiresAt = cache.getTtl(key);
  const remainingTtl = expiresAt ? Math.max(1, Math.ceil((expiresAt - now) / 1000)) : WINDOW_SECONDS;
  cache.set<WindowRecord>(key, existing, remainingTtl);

  return { success: true, limit, remaining: limit - existing.count, reset: existing.reset };
}

export async function rateLimit(identifier: string, isPublic = false): Promise<void> {
  const result = checkRateLimit(identifier, isPublic);
  if (!result.success) {
    throw new ApiError(429, 'Too many requests');
  }
}
