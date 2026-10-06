/**
 * Idempotency Module
 * 
 * Ensures that operations can be safely retried without causing duplicates.
 * Critical for financial operations where network failures might cause
 * the same request to be sent multiple times.
 * 
 * Principle: "Every money-moving operation is auditable and idempotent"
 */

// ============================================
// TYPES
// ============================================

export interface IdempotencyRecord {
  key: string;
  status: 'pending' | 'completed' | 'failed';
  response?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
  requestHash: string;
}

// ============================================
// STORAGE
// ============================================

const IDEMPOTENCY_STORAGE_KEY = 'ivo_idempotency_keys';
const MAX_RECORDS = 500;
const RECORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Generate a unique idempotency key
 * 
 * @param prefix - Optional prefix for the key (e.g., 'order', 'payment')
 * @param context - Optional context to include in the key
 * @returns Unique idempotency key
 */
export function generateIdempotencyKey(prefix = 'op', context?: Record<string, any>): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const contextHash = context ? hashObject(context) : '';
  
  return `${prefix}_${timestamp}_${random}${contextHash ? `_${contextHash}` : ''}`;
}

/**
 * Check if an operation has already been performed
 * 
 * @param key - The idempotency key
 * @returns The previous response if the operation was already completed, null otherwise
 */
export function checkIdempotency(key: string): IdempotencyRecord | null {
  const records = getAllRecords();
  const record = records.find(r => r.key === key);
  
  if (!record) return null;
  
  // Check if record has expired
  if (isExpired(record)) {
    removeRecord(key);
    return null;
  }
  
  return record;
}

/**
 * Mark an operation as started (pending)
 * 
 * @param key - The idempotency key
 * @param requestHash - Hash of the request payload
 */
export function markOperationStarted(key: string, requestHash: string): void {
  const record: IdempotencyRecord = {
    key,
    status: 'pending',
    createdAt: new Date().toISOString(),
    requestHash,
  };
  
  saveRecord(record);
}

/**
 * Mark an operation as completed successfully
 * 
 * @param key - The idempotency key
 * @param response - The response from the operation
 */
export function markOperationCompleted(key: string, response: any): void {
  const records = getAllRecords();
  const index = records.findIndex(r => r.key === key);
  
  if (index === -1) {
    console.warn(`Idempotency key ${key} not found`);
    return;
  }
  
  records[index] = {
    ...records[index],
    status: 'completed',
    response,
    completedAt: new Date().toISOString(),
  };
  
  saveAllRecords(records);
}

/**
 * Mark an operation as failed
 * 
 * @param key - The idempotency key
 * @param error - The error message
 */
export function markOperationFailed(key: string, error: string): void {
  const records = getAllRecords();
  const index = records.findIndex(r => r.key === key);
  
  if (index === -1) {
    console.warn(`Idempotency key ${key} not found`);
    return;
  }
  
  records[index] = {
    ...records[index],
    status: 'failed',
    error,
    completedAt: new Date().toISOString(),
  };
  
  saveAllRecords(records);
}

/**
 * Remove an idempotency record
 */
export function removeRecord(key: string): void {
  const records = getAllRecords().filter(r => r.key !== key);
  saveAllRecords(records);
}

/**
 * Clean up expired records
 */
export function cleanupExpiredRecords(): number {
  const records = getAllRecords();
  const validRecords = records.filter(r => !isExpired(r));
  const removedCount = records.length - validRecords.length;
  
  saveAllRecords(validRecords);
  
  return removedCount;
}

/**
 * Get all idempotency records
 */
export function getAllIdempotencyRecords(): IdempotencyRecord[] {
  return getAllRecords();
}

// ============================================
// WRAPPER FOR IDEMPOTENT OPERATIONS
// ============================================

/**
 * Execute an operation with idempotency protection
 * 
 * @param key - The idempotency key
 * @param operation - The operation to execute
 * @param requestPayload - The request payload (used for hash comparison)
 * @returns The operation result
 * 
 * @example
 * const result = await withIdempotency(
 *   'order_123',
 *   async () => await createOrder(orderData),
 *   orderData
 * );
 */
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  requestPayload?: any
): Promise<T> {
  // Check if already completed
  const existing = checkIdempotency(key);
  
  if (existing) {
    if (existing.status === 'completed') {
      console.log(`[Idempotency] Returning cached result for ${key}`);
      return existing.response as T;
    }
    
    if (existing.status === 'pending') {
      // Operation is in progress - wait or fail
      throw new Error(`Operation ${key} is already in progress`);
    }
    
    if (existing.status === 'failed') {
      // Previous attempt failed - allow retry
      console.log(`[Idempotency] Retrying failed operation ${key}`);
    }
  }
  
  // Mark as started
  const requestHash = requestPayload ? hashObject(requestPayload) : '';
  markOperationStarted(key, requestHash);
  
  try {
    // Execute the operation
    const result = await operation();
    
    // Mark as completed
    markOperationCompleted(key, result);
    
    return result;
  } catch (error) {
    // Mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    markOperationFailed(key, errorMessage);
    
    throw error;
  }
}

// ============================================
// HELPERS
// ============================================

function getAllRecords(): IdempotencyRecord[] {
  try {
    const stored = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecord(record: IdempotencyRecord): void {
  const records = getAllRecords();
  
  // Remove existing record with same key
  const filtered = records.filter(r => r.key !== record.key);
  
  // Add new record
  filtered.push(record);
  
  // Trim to max size
  if (filtered.length > MAX_RECORDS) {
    filtered.splice(0, filtered.length - MAX_RECORDS);
  }
  
  saveAllRecords(filtered);
}

function saveAllRecords(records: IdempotencyRecord[]): void {
  try {
    localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save idempotency records:', error);
  }
}

function isExpired(record: IdempotencyRecord): boolean {
  const created = new Date(record.createdAt).getTime();
  const now = Date.now();
  return now - created > RECORD_TTL_MS;
}

function hashObject(obj: any): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}
