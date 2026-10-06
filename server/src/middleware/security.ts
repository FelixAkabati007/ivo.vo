import { Context, Next } from 'hono';

/**
 * Security Headers Middleware
 * Implements comprehensive security headers for all responses
 */
export async function securityHeaders(c: Context, next: Next) {
  await next();

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-inline/eval in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.paystack.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  c.header('Content-Security-Policy', cspDirectives.join('; '));
  
  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');
  
  // Enable XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Control referrer information
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Control permissions/features
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  
  // Prevent caching of sensitive data
  if (c.req.path.includes('/api/') && !c.req.path.includes('/products')) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
}

/**
 * Request Size Limiter Middleware
 * Prevents oversized requests
 */
export function requestSizeLimit(maxSize: number = 1024 * 1024) { // 1MB default
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return c.json({
        success: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: `Request size exceeds limit of ${maxSize} bytes`,
        },
      }, 413);
    }
    
    await next();
  };
}

/**
 * Timeout Middleware
 * Prevents long-running requests
 */
export function requestTimeout(timeoutMs: number = 30000) { // 30s default
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      await next();
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
