import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function errorHandler(err: Error, c: Context) {
  console.error('[Error]', err);

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        code: `HTTP_${err.status}`,
        message: err.message,
      },
    }, err.status);
  }

  // Validation errors
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: (err as any).errors,
      },
    }, 400);
  }

  // Database errors
  if (err.message?.includes('violates unique constraint')) {
    return c.json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
      },
    }, 409);
  }

  // Default error
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  }, 500);
}
