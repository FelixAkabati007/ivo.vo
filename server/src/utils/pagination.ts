/**
 * Pagination Utilities
 * 
 * Supports both offset-based and cursor-based pagination.
 * Follows API conventions with bounded page sizes.
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
  minPageSize: number;
}

const DEFAULT_CONFIG: PaginationConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,
  minPageSize: 1,
};

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(
  params: PaginationParams,
  config: Partial<PaginationConfig> = {}
): { page: number; pageSize: number; offset: number; limit: number } {
  const { defaultPageSize, maxPageSize, minPageSize } = { ...DEFAULT_CONFIG, ...config };

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(minPageSize, params.pageSize || params.limit || defaultPageSize)
  );
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
}

/**
 * Create pagination result from query results
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  params: { page: number; pageSize: number }
): PaginationResult<T> {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Cursor-based pagination helpers
 */
export function encodeCursor(data: { id: string; createdAt?: Date }): string {
  const cursorData = {
    id: data.id,
    createdAt: data.createdAt?.toISOString(),
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

export function decodeCursor(cursor: string): { id: string; createdAt?: string } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    throw new Error('Invalid cursor');
  }
}

/**
 * Apply pagination to Drizzle query
 */
export function applyPagination(
  query: any,
  pagination: { offset: number; limit: number }
) {
  return query.limit(pagination.limit).offset(pagination.offset);
}

/**
 * Get total count for pagination
 */
export async function getTotalCount(query: any): Promise<number> {
  const [result] = await query;
  return result?.count || 0;
}

/**
 * Pagination metadata for OpenAPI
 */
export const PAGINATION_SCHEMA = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    cursor: { type: 'string', description: 'Cursor for cursor-based pagination' },
  },
};

export const PAGINATION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
    total: { type: 'integer' },
    totalPages: { type: 'integer' },
    hasNext: { type: 'boolean' },
    hasPrev: { type: 'boolean' },
    nextCursor: { type: 'string' },
    prevCursor: { type: 'string' },
  },
  required: ['page', 'pageSize', 'total', 'totalPages', 'hasNext', 'hasPrev'],
};
