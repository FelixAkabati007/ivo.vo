import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createHash, randomBytes } from 'crypto';

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
function validateCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Compare tokens using timing-safe comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * CSRF Protection Middleware
 * - Generates CSRF token and sets it as HTTP-only cookie
 * - Validates CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 * - Exempts webhook endpoints (they use signature verification instead)
 */
export async function csrfProtection(c: Context, next: Next) {
  const method = c.req.method;
  const path = c.req.path;
  
  // Exempt webhook endpoints (they use signature verification)
  if (path.includes('/webhook')) {
    await next();
    return;
  }
  
  // Exempt safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Generate and set CSRF token if not present
    let csrfToken = getCookie(c, CSRF_COOKIE_NAME);
    
    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      setCookie(c, CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }
    
    // Add CSRF token to response headers for client to read
    c.header('X-CSRF-Token', csrfToken);
    
    await next();
    return;
  }
  
  // Validate CSRF token for state-changing requests
  const cookieToken = getCookie(c, CSRF_COOKIE_NAME);
  const headerToken = c.req.header(CSRF_HEADER_NAME);
  
  if (!validateCsrfToken(cookieToken, headerToken)) {
    return c.json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token validation failed. Please refresh the page and try again.',
      },
    }, 403);
  }
  
  await next();
}

/**
 * Get CSRF token endpoint
 * Clients can call this to get a fresh CSRF token
 */
export function getCsrfToken(c: Context) {
  let csrfToken = getCookie(c, CSRF_COOKIE_NAME);
  
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    setCookie(c, CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
  }
  
  return c.json({
    success: true,
    data: {
      csrfToken,
    },
  });
}

/**
 * Clear CSRF token
 */
export function clearCsrfToken(c: Context) {
  deleteCookie(c, CSRF_COOKIE_NAME);
  return c.json({
    success: true,
    data: { message: 'CSRF token cleared' },
  });
}
