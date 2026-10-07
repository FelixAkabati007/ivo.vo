import { Context, Next } from 'hono';
import { v4 as uuidv4 } from 'uuid';

export async function requestLogger(c: Context, next: Next) {
  const requestId = c.req.header('x-request-id') || uuidv4();
  const correlationId = c.req.header('x-correlation-id') || uuidv4();
  const startTime = Date.now();
  
  // Add request IDs to context
  c.set('requestId', requestId);
  c.set('correlationId', correlationId);
  
  // Add to response headers
  c.header('X-Request-Id', requestId);
  c.header('X-Correlation-Id', correlationId);
  
  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    const status = c.res.status;
    
    // Structured log
    console.log(JSON.stringify({
      type: 'request',
      requestId,
      correlationId,
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    }));
  }
}
