/**
 * Audit Logging Module
 * 
 * Provides structured audit logging for all state-changing operations.
 * Every financial operation, order state change, and security event
 * is logged with full context for compliance and debugging.
 * 
 * Principle: "Every money-moving operation is auditable and idempotent"
 */

// ============================================
// TYPES
// ============================================

export type AuditAction =
  // Cart operations
  | 'cart.item_added'
  | 'cart.item_updated'
  | 'cart.item_removed'
  | 'cart.cleared'
  // Order operations
  | 'order.created'
  | 'order.status_changed'
  | 'order.cancelled'
  | 'order.refunded'
  // Payment operations
  | 'payment.initialized'
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.webhook_received'
  // Security operations
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.password_changed'
  // System operations
  | 'system.config_changed'
  | 'system.error'
  | 'system.health_check';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  severity: AuditSeverity;
  entityType: string;
  entityId: string;
  actor: {
    type: 'user' | 'system' | 'anonymous';
    id?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata?: Record<string, any>;
  correlationId: string;
  requestId: string;
}

// ============================================
// AUDIT LOG STORE
// ============================================

const AUDIT_STORAGE_KEY = 'ivo_audit_log';
const MAX_LOCAL_ENTRIES = 1000;

let auditBuffer: AuditEntry[] = [];
let correlationId: string = generateCorrelationId();
let requestId: string = generateRequestId();

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Log an audit event
 * 
 * @param action - The action being performed
 * @param entityType - Type of entity (e.g., 'order', 'payment', 'cart')
 * @param entityId - ID of the entity
 * @param options - Additional context
 */
export function auditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  options: {
    severity?: AuditSeverity;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    metadata?: Record<string, any>;
    actorId?: string;
    sessionId?: string;
  } = {}
): AuditEntry {
  const entry: AuditEntry = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    action,
    severity: options.severity || inferSeverity(action),
    entityType,
    entityId,
    actor: {
      type: options.actorId ? 'user' : options.sessionId ? 'anonymous' : 'system',
      id: options.actorId,
      sessionId: options.sessionId,
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
    },
    previousState: options.previousState,
    newState: options.newState,
    metadata: options.metadata,
    correlationId,
    requestId,
  };

  // Buffer the entry
  auditBuffer.push(entry);

  // Persist to localStorage (for development/debugging)
  persistToLocal(entry);

  // In production, this would be sent to a server-side endpoint
  // that writes to the audit_log table in Neon
  if (isServerAvailable()) {
    sendToServer(entry).catch(console.error);
  }

  // Console output for development
  if (import.meta.env.DEV) {
    console.log(
      `%c[AUDIT] ${action}`,
      `color: ${getSeverityColor(entry.severity)}; font-weight: bold;`,
      { entityType, entityId, entry }
    );
  }

  return entry;
}

/**
 * Start a new correlation context
 * Call this at the start of a user flow (e.g., checkout)
 */
export function startCorrelation(): string {
  correlationId = generateCorrelationId();
  requestId = generateRequestId();
  return correlationId;
}

/**
 * Get the current correlation ID
 */
export function getCorrelationId(): string {
  return correlationId;
}

/**
 * Get the current request ID
 */
export function getRequestId(): string {
  return requestId;
}

/**
 * Get all audit entries from local storage
 */
export function getLocalAuditLog(): AuditEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear local audit log
 */
export function clearLocalAuditLog(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}

/**
 * Get audit entries for a specific entity
 */
export function getAuditForEntity(entityType: string, entityId: string): AuditEntry[] {
  return getLocalAuditLog().filter(
    e => e.entityType === entityType && e.entityId === entityId
  );
}

// ============================================
// PERSISTENCE
// ============================================

function persistToLocal(entry: AuditEntry): void {
  try {
    const existing = getLocalAuditLog();
    existing.push(entry);
    
    // Trim to max size
    if (existing.length > MAX_LOCAL_ENTRIES) {
      existing.splice(0, existing.length - MAX_LOCAL_ENTRIES);
    }
    
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to persist audit log:', error);
  }
}

async function sendToServer(entry: AuditEntry): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  
  await fetch(`${apiUrl}/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': entry.requestId,
      'X-Correlation-Id': entry.correlationId,
    },
    body: JSON.stringify(entry),
    keepalive: true, // Ensures the request completes even if the page unloads
  });
}

// ============================================
// HELPERS
// ============================================

function inferSeverity(action: AuditAction): AuditSeverity {
  if (action.includes('failed') || action.includes('error')) return 'error';
  if (action.includes('refunded') || action.includes('cancelled')) return 'warning';
  if (action.includes('payment') || action.includes('order.created')) return 'info';
  return 'info';
}

function getSeverityColor(severity: AuditSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
}

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(): string {
  // In production, this would come from the server
  // Client-side IP detection is unreliable
  return 'client-side';
}

function isServerAvailable(): boolean {
  return !!import.meta.env.VITE_API_BASE_URL;
}
