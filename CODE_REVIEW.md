# FunnelSwift Code Review

## Summary
Overall, this is a well-structured Next.js 14 app with good architecture following the Bolt prompt specifications. The code is clean, uses proper TypeScript, and implements the required security measures.

## Issues Found

### 1. CRITICAL: Missing Environment Variables Validation
**File:** Multiple files using `process.env.*`
**Issue:** No validation that required env vars are set. App will fail silently or with cryptic errors.
**Fix:** Create a `lib/env.ts` file with Zod validation:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ALLOWED_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### 2. HIGH: API Key Comparison is Inefficient
**File:** `lib/api/auth.ts` - `validateApiKey()`
**Issue:** The function fetches ALL API keys and compares hashes one-by-one. This is O(n) and will slow down as keys grow.
**Fix:** Store a hash prefix or use a different lookup strategy. For now, add caching.

### 3. MEDIUM: Missing Rate Limiting Implementation
**File:** `lib/api/rate-limit.ts` (doesn't exist)
**Issue:** The prompt mentions rate limiting but it's not implemented. The `package.json` doesn't include `@upstash/ratelimit` or Redis.
**Fix:** Install and implement:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 4. MEDIUM: Twilio Webhook Route Missing
**File:** `app/api/webhooks/twilio/route.ts` (doesn't exist)
**Issue:** The prompt specifies a Twilio webhook for SMS, but it's not implemented.
**Fix:** Create the route with proper signature validation.

### 5. MEDIUM: Missing CSP Headers in next.config
**File:** `next.config.js` or `next.config.ts` (doesn't exist)
**Issue:** The prompt requires strict CSP headers but they're not configured.
**Fix:** Create `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 6. LOW: Inconsistent Error Handling
**File:** Multiple API routes
**Issue:** Some places use `ApiError`, others throw raw errors. Not consistent.
**Fix:** Standardize on `ApiError` for all API errors.

### 7. LOW: Missing Input Sanitization
**File:** `app/api/v1/leads/route.ts`
**Issue:** No sanitization of user inputs before database insertion (XSS risk).
**Fix:** Use a sanitization library like `dompurify` for any HTML content.

### 8. LOW: No Database Transaction for Multi-Step Operations
**File:** `app/api/v1/leads/route.ts` - POST handler
**Issue:** If tag insertion fails after contact creation, you have a partial state.
**Fix:** Use Supabase transactions (RPC) for atomic operations.

### 9. LOW: Missing Health Check Endpoint
**File:** `app/api/v1/health/route.ts` (doesn't exist)
**Issue:** The prompt specifies a health check endpoint but it's missing.
**Fix:** Create simple endpoint:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### 10. LOW: TypeScript Strictness
**File:** `tsconfig.json`
**Issue:** Need to verify strict mode is enabled for type safety.
**Fix:** Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Recommendations

### 1. Add Logging
Add structured logging (Winston or Pino) instead of `console.error`.

### 2. Add Tests
No test files found. Add at minimum:
- Unit tests for `calculateLeadScore`
- API route tests
- Integration tests for Supabase operations

### 3. Add API Documentation
Consider adding Swagger/OpenAPI docs for the API routes.

### 4. Database Migrations
No migration files found. Use Supabase CLI for migrations:
```bash
npm install -g supabase
supabase db diff
```

## Files to Create

1. `next.config.js` - CSP headers
2. `lib/env.ts` - Environment validation
3. `lib/api/rate-limit.ts` - Rate limiting
4. `app/api/webhooks/twilio/route.ts` - SMS webhook
5. `app/api/v1/health/route.ts` - Health check
6. `middleware.ts` - Next.js middleware for auth/security

## Files to Modify

1. `lib/api/auth.ts` - Optimize API key lookup
2. `app/api/v1/leads/route.ts` - Add transactions, better error handling
3. `package.json` - Add missing dependencies

## Overall Grade: B+

Good foundation, follows architecture, needs security hardening and missing features implemented.
