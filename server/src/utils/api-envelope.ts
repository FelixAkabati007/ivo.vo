/**
 * API Error Envelope
 * 
 * Consistent error response format across all API endpoints.
 * Follows the specification:
 * - Stable machine-readable code
 * - Human-readable message
 * - Request ID
 * - Field errors when appropriate
 * - No stack traces or internal details
 */

export interface APIErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface APISuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
    version: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Error codes - stable, machine-readable
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  OWNERSHIP_REQUIRED: 'OWNERSHIP_REQUIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONFLICT: 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  ORDER_NOT_PAYABLE: 'ORDER_NOT_PAYABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PROMOTION_EXPIRED: 'PROMOTION_EXPIRED',
  PROMOTION_USAGE_LIMIT: 'PROMOTION_USAGE_LIMIT',
  PROMOTION_NOT_ELIGIBLE: 'PROMOTION_NOT_ELIGIBLE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Security
  CSRF_VALIDATION_FAILED: 'CSRF_VALIDATION_FAILED',
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
  
  // Payment
  PAYMENT_INITIALIZATION_FAILED: 'PAYMENT_INITIALIZATION_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Request
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  
  // Not Found
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Create error envelope
 */
export function createErrorEnvelope(
  code: ErrorCode,
  message: string,
  options: {
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
    details?: Record<string, any>;
    statusCode?: number;
  } = {}
): APIErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      ...(options.requestId && { requestId: options.requestId }),
      ...(options.fieldErrors && { fieldErrors: options.fieldErrors }),
      ...(options.details && { details: options.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };
}

/**
 * Create success envelope
 */
export function createSuccessEnvelope<T>(
  data: T,
  options: {
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
  } = {}
): APISuccessEnvelope<T> {
  const envelope: APISuccessEnvelope<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  if (options.requestId) {
    envelope.meta!.requestId = options.requestId;
  }

  if (options.pagination) {
    const { page, pageSize, total } = options.pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    envelope.meta!.pagination = {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  return envelope;
}

/**
 * Validation error helper
 */
export function createValidationError(
  fieldErrors: Record<string, string[]>,
  requestId?: string
): APIErrorEnvelope {
  return createErrorEnvelope(
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed. Please check the input fields.',
    {
      requestId,
      fieldErrors,
      statusCode: 400,
    }
  );
}

/**
 * Not found error helper
 */
export function createNotFoundError(
  resource: string,
  requestId?: string
): APIErrorEnvelope {
  return createErrorEnvelope(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found.`,
    {
      requestId,
      statusCode: 404,
    }
  );
}

/**
 * Unauthorized error helper
 */
export function createUnauthorizedError(
  message: string = 'Authentication required.',
  requestId?: string
): APIErrorEnvelope {
  return createErrorEnvelope(
    ERROR_CODES.UNAUTHORIZED,
    message,
    {
      requestId,
      statusCode: 401,
    }
  );
}

/**
 * Forbidden error helper
 */
export function createForbiddenError(
  message: string = 'You do not have permission to perform this action.',
  requestId?: string
): APIErrorEnvelope {
  return createErrorEnvelope(
    ERROR_CODES.FORBIDDEN,
    message,
    {
      requestId,
      statusCode: 403,
    }
  );
}

/**
 * Internal error helper (sanitized for client)
 */
export function createInternalError(
  requestId?: string,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): APIErrorEnvelope {
  return createErrorEnvelope(
    ERROR_CODES.INTERNAL_ERROR,
    isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : 'Internal server error',
    {
      requestId,
      statusCode: 500,
    }
  );
}
