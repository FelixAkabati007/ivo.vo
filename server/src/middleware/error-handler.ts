import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  createErrorEnvelope, 
  createValidationError, 
  createInternalError,
  ERROR_CODES 
} from '../utils/api-envelope';

export async function errorHandler(err: Error, c: Context) {
  const requestId = c.get('requestId') || c.req.header('x-request-id');
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error with context (but don't expose details to client)
  console.error('[Error]', {
    requestId,
    error: err.message,
    stack: isProduction ? undefined : err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(createErrorEnvelope(
      ERROR_CODES[`HTTP_${err.status}` as keyof typeof ERROR_CODES] || ERROR_CODES.INTERNAL_ERROR,
      err.message,
      { requestId, statusCode: err.status }
    ), err.status);
  }

  // Validation errors (Zod)
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const fieldErrors: Record<string, string[]> = {};
    
    zodError.errors?.forEach((issue: any) => {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    });

    return c.json(createValidationError(fieldErrors, requestId), 400);
  }

  // Database unique constraint violations
  if (err.message?.includes('violates unique constraint')) {
    return c.json(createErrorEnvelope(
      ERROR_CODES.DUPLICATE_ENTRY,
      'A record with this value already exists.',
      { requestId, statusCode: 409 }
    ), 409);
  }

  // Database connection errors
  if (err.message?.includes('connection') || err.message?.includes('database')) {
    return c.json(createErrorEnvelope(
      ERROR_CODES.DATABASE_ERROR,
      isProduction ? 'Database service is temporarily unavailable.' : err.message,
      { requestId, statusCode: 503 }
    ), 503);
  }

  // External service errors (payment provider, email, etc.)
  if (err.message?.includes('provider') || err.message?.includes('external')) {
    return c.json(createErrorEnvelope(
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      isProduction ? 'External service is temporarily unavailable.' : err.message,
      { requestId, statusCode: 502 }
    ), 502);
  }

  // Default internal error (sanitized for production)
  return c.json(createInternalError(requestId, isProduction), 500);
}
