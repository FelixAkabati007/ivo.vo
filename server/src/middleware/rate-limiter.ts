import { Context, Next } from 'hono';

// Simple in-memory rate limiter
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export async function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const now = Date.now();
  
  let record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + WINDOW_MS };
    rateLimitStore.set(ip, record);
  }
  
  record.count++;
  
  if (record.count > MAX_REQUESTS) {
    return c.json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    }, 429);
  }
  
  // Add rate limit headers
  c.header('X-RateLimit-Limit', MAX_REQUESTS.toString());
  c.header('X-RateLimit-Remaining', (MAX_REQUESTS - record.count).toString());
  c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
  
  await next();
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
