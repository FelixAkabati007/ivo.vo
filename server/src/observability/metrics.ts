/**
 * Observability Module - Metrics, Logging, and Monitoring
 * 
 * Implements comprehensive observability for ivo Electronics:
 * - Metrics collection and tracking
 * - Structured logging with redaction
 * - Health checks and readiness probes
 * - SLO tracking and alerting
 */

import { createHash } from 'crypto';

// ============================================
// METRICS DEFINITIONS
// ============================================

export interface MetricDefinition {
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram';
  labels?: string[];
  unit?: string;
}

export const METRICS = {
  // Storefront metrics
  STOREFRONT_AVAILABILITY: {
    name: 'storefront_availability',
    description: 'Storefront availability percentage',
    type: 'gauge',
    unit: 'percent',
  },
  API_LATENCY: {
    name: 'api_latency_seconds',
    description: 'API request latency by route',
    type: 'histogram',
    labels: ['route', 'method', 'status'],
    unit: 'seconds',
  },
  ERROR_RATE: {
    name: 'error_rate',
    description: 'Error rate by endpoint',
    type: 'counter',
    labels: ['endpoint', 'error_type'],
  },
  TIMEOUT_RATE: {
    name: 'timeout_rate',
    description: 'Timeout rate by endpoint',
    type: 'counter',
    labels: ['endpoint'],
  },

  // Database metrics
  DB_CONNECTION_ERRORS: {
    name: 'db_connection_errors',
    description: 'Database connection errors',
    type: 'counter',
  },
  DB_QUERY_LATENCY: {
    name: 'db_query_latency_seconds',
    description: 'Database query latency',
    type: 'histogram',
    labels: ['query_type'],
    unit: 'seconds',
  },

  // Checkout funnel metrics
  CHECKOUT_FUNNEL: {
    name: 'checkout_funnel',
    description: 'Checkout conversion funnel',
    type: 'counter',
    labels: ['step'],
  },
  CHECKOUT_DROPOFF: {
    name: 'checkout_dropoff',
    description: 'Checkout drop-off by step',
    type: 'counter',
    labels: ['step', 'reason'],
  },

  // Order metrics
  ORDERS_CREATED: {
    name: 'orders_created',
    description: 'Orders created',
    type: 'counter',
    labels: ['status'],
  },
  ORDERS_PAID: {
    name: 'orders_paid',
    description: 'Orders paid',
    type: 'counter',
  },
  ORDERS_FAILED: {
    name: 'orders_failed',
    description: 'Orders failed',
    type: 'counter',
    labels: ['reason'],
  },
  ORDERS_CANCELLED: {
    name: 'orders_cancelled',
    description: 'Orders cancelled',
    type: 'counter',
    labels: ['reason'],
  },
  ORDERS_PENDING: {
    name: 'orders_pending',
    description: 'Orders pending payment',
    type: 'gauge',
  },

  // Payment metrics
  PAYMENT_VERIFICATION_LATENCY: {
    name: 'payment_verification_latency_seconds',
    description: 'Payment verification latency',
    type: 'histogram',
    unit: 'seconds',
  },
  WEBHOOK_PROCESSING_DELAY: {
    name: 'webhook_processing_delay_seconds',
    description: 'Webhook processing delay',
    type: 'histogram',
    unit: 'seconds',
  },
  DUPLICATE_WEBHOOKS: {
    name: 'duplicate_webhooks',
    description: 'Duplicate webhook count',
    type: 'counter',
  },
  IDEMPOTENCY_CONFLICTS: {
    name: 'idempotency_conflicts',
    description: 'Idempotency conflict count',
    type: 'counter',
  },

  // Inventory metrics
  INVENTORY_RESERVATION_CONFLICTS: {
    name: 'inventory_reservation_conflicts',
    description: 'Inventory reservation conflicts',
    type: 'counter',
  },
  INVENTORY_RESERVATION_EXPIRIES: {
    name: 'inventory_reservation_expiries',
    description: 'Inventory reservation expiries',
    type: 'counter',
  },

  // Refund metrics
  REFUND_VOLUME: {
    name: 'refund_volume',
    description: 'Refund volume',
    type: 'counter',
    labels: ['currency'],
  },
  RECONCILIATION_DISCREPANCIES: {
    name: 'reconciliation_discrepancies',
    description: 'Reconciliation discrepancies',
    type: 'counter',
  },

  // n8n workflow metrics
  N8N_WORKFLOW_SUCCESS: {
    name: 'n8n_workflow_success',
    description: 'n8n workflow success count',
    type: 'counter',
    labels: ['workflow'],
  },
  N8N_WORKFLOW_FAILURE: {
    name: 'n8n_workflow_failure',
    description: 'n8n workflow failure count',
    type: 'counter',
    labels: ['workflow', 'error_type'],
  },
  N8N_WORKFLOW_RETRY: {
    name: 'n8n_workflow_retry',
    description: 'n8n workflow retry count',
    type: 'counter',
    labels: ['workflow'],
  },
  N8N_DEAD_LETTER: {
    name: 'n8n_dead_letter',
    description: 'n8n dead letter count',
    type: 'counter',
    labels: ['workflow'],
  },

  // Email/SMS metrics
  EMAIL_DELIVERY: {
    name: 'email_delivery',
    description: 'Email delivery outcomes',
    type: 'counter',
    labels: ['status', 'template'],
  },
  SMS_DELIVERY: {
    name: 'sms_delivery',
    description: 'SMS delivery outcomes',
    type: 'counter',
    labels: ['status', 'template'],
  },

  // AI metrics
  AI_LATENCY: {
    name: 'ai_latency_seconds',
    description: 'AI request latency',
    type: 'histogram',
    labels: ['tool'],
    unit: 'seconds',
  },
  AI_COST: {
    name: 'ai_cost',
    description: 'AI cost',
    type: 'counter',
    labels: ['tool', 'model'],
    unit: 'currency',
  },
  AI_REFUSAL_RATE: {
    name: 'ai_refusal_rate',
    description: 'AI refusal rate',
    type: 'counter',
    labels: ['tool'],
  },
  AI_ESCALATION_RATE: {
    name: 'ai_escalation_rate',
    description: 'AI escalation rate',
    type: 'counter',
    labels: ['tool'],
  },
} as const;

// ============================================
// METRICS REGISTRY
// ============================================

class MetricsRegistry {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter
   */
  increment(metric: MetricDefinition, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.buildKey(metric.name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(metric: MetricDefinition, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(metric.name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram observation
   */
  observe(metric: MetricDefinition, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(metric.name, labels);
    const observations = this.histograms.get(key) || [];
    observations.push(value);
    this.histograms.set(key, observations);
  }

  /**
   * Get all metrics
   */
  getMetrics(): {
    counters: Map<string, number>;
    gauges: Map<string, number>;
    histograms: Map<string, number[]>;
  } {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Build metric key with labels
   */
  private buildKey(name: string, labels: Record<string, string>): string {
    const labelParts = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelParts ? `${name}{${labelParts}}` : name;
  }
}

export const metricsRegistry = new MetricsRegistry();

// ============================================
// STRUCTURED LOGGING
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  requestId?: string;
  traceId?: string;
  correlationId?: string;
  message: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  sessionId?: string;
  meta Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Fields to redact from logs
const REDACTED_FIELDS = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'cvc',
  'pin',
  'otp',
  'ssn',
  'nationalId',
  'email',
  'phone',
  'address',
  'webhookBody',
  'paymentToken',
];

/**
 * Redact sensitive fields from log data
 */
function redactSensitiveData(data: Record<string, any>): Record<string, any> {
  const redacted = { ...data };
  
  for (const field of REDACTED_FIELDS) {
    if (redacted[field] !== undefined) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  // Recursively redact nested objects
  for (const [key, value] of Object.entries(redacted)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value);
    }
  }
  
  return redacted;
}

/**
 * Create a structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  context: {
    service?: string;
    environment?: string;
    requestId?: string;
    traceId?: string;
    correlationId?: string;
    entityId?: string;
    entityType?: string;
    userId?: string;
    sessionId?: string;
    meta Record<string, any>;
    error?: Error;
  } = {}
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: context.service || process.env.SERVICE_NAME || 'ivo-api',
    environment: context.environment || process.env.NODE_ENV || 'development',
    message,
  };

  if (context.requestId) entry.requestId = context.requestId;
  if (context.traceId) entry.traceId = context.traceId;
  if (context.correlationId) entry.correlationId = context.correlationId;
  if (context.entityId) entry.entityId = context.entityId;
  if (context.entityType) entry.entityType = context.entityType;
  if (context.userId) entry.userId = context.userId;
  if (context.sessionId) entry.sessionId = context.sessionId;
  
  if (context.meta {
    entry.meta redactSensitiveData(context.meta);
  }
  
  if (context.error) {
    entry.error = {
      name: context.error.name,
      message: context.error.message,
      stack: process.env.NODE_ENV !== 'production' ? context.error.stack : undefined,
    };
  }

  return entry;
}

/**
 * Log a structured entry
 */
export function log(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  
  switch (entry.level) {
    case 'debug':
      console.debug(output);
      break;
    case 'info':
      console.info(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
    case 'fatal':
      console.error(output);
      break;
  }
}

/**
 * Convenience logging functions
 */
export const logger = {
  debug: (message: string, context?: any) => log(createLogEntry('debug', message, context)),
  info: (message: string, context?: any) => log(createLogEntry('info', message, context)),
  warn: (message: string, context?: any) => log(createLogEntry('warn', message, context)),
  error: (message: string, error?: Error, context?: any) => 
    log(createLogEntry('error', message, { ...context, error })),
  fatal: (message: string, error?: Error, context?: any) => 
    log(createLogEntry('fatal', message, { ...context, error })),
};

// ============================================
// HEALTH CHECKS
// ============================================

export interface HealthCheck {
  name: string;
  check: () => Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; message?: string }>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    latency?: number;
  }>;
  timestamp: string;
  version: string;
}

/**
 * Database health check
 */
export const databaseHealthCheck: HealthCheck = {
  name: 'database',
  check: async () => {
    try {
      const startTime = Date.now();
      
      // Import dynamically to avoid circular dependencies
      const { db } = await import('../db');
      const { sql } = await import('drizzle-orm');
      
      // Execute a simple query to verify connectivity
      await db.execute(sql`SELECT 1`);
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: `Connected (latency: ${latency}ms)`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },
};

/**
 * Payment provider health check
 */
export const paymentProviderHealthCheck: HealthCheck = {
  name: 'payment_provider',
  check: async () => {
    try {
      // Check if Paystack credentials are configured
      if (!process.env.PAYSTACK_SECRET_KEY) {
        return {
          status: 'degraded',
          message: 'Payment provider not configured',
        };
      }
      
      // In production, you would make a lightweight API call to verify connectivity
      // For now, just check that credentials exist
      return {
        status: 'healthy',
        message: 'Payment provider configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  },
};

/**
 * n8n health check
 */
export const n8nHealthCheck: HealthCheck = {
  name: 'n8n',
  check: async () => {
    try {
      if (!process.env.N8N_WEBHOOK_URL) {
        return {
          status: 'degraded',
          message: 'n8n not configured',
        };
      }
      
      return {
        status: 'healthy',
        message: 'n8n configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  },
};

/**
 * Run all health checks
 */
export async function runHealthChecks(checks: HealthCheck[]): Promise<HealthStatus> {
  const results = await Promise.all(
    checks.map(async (check) => {
      const startTime = Date.now();
      try {
        const result = await check.check();
        return {
          name: check.name,
          ...result,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        return {
          name: check.name,
          status: 'unhealthy' as const,
          message: error instanceof Error ? error.message : 'Check failed',
          latency: Date.now() - startTime,
        };
      }
    })
  );

  const hasUnhealthy = results.some(r => r.status === 'unhealthy');
  const hasDegraded = results.some(r => r.status === 'degraded');

  return {
    status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
    checks: results,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  };
}

// ============================================
// SLO DEFINITIONS
// ============================================

export interface SLODefinition {
  name: string;
  description: string;
  target: number;
  window: string; // e.g., '30d', '7d', '24h'
  metric: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export const SLOS: SLODefinition[] = [
  {
    name: 'API Availability',
    description: 'Customer-critical API routes availability',
    target: 99.9, // 99.9% monthly availability
    window: '30d',
    metric: 'storefront_availability',
    severity: 'critical',
  },
  {
    name: 'API Latency (p95)',
    description: '95th percentile API latency',
    target: 500, // 500ms
    window: '5m',
    metric: 'api_latency_seconds',
    severity: 'high',
  },
  {
    name: 'Error Rate',
    description: 'API error rate',
    target: 1, // 1%
    window: '5m',
    metric: 'error_rate',
    severity: 'high',
  },
  {
    name: 'Database Query Latency (p95)',
    description: '95th percentile database query latency',
    target: 100, // 100ms
    window: '5m',
    metric: 'db_query_latency_seconds',
    severity: 'medium',
  },
  {
    name: 'Payment Verification Latency (p95)',
    description: '95th percentile payment verification latency',
    target: 2000, // 2s
    window: '5m',
    metric: 'payment_verification_latency_seconds',
    severity: 'high',
  },
  {
    name: 'Checkout Success Rate',
    description: 'Checkout completion success rate',
    target: 95, // 95%
    window: '1h',
    metric: 'checkout_funnel',
    severity: 'critical',
  },
];

// ============================================
// RESILIENCE CONFIGURATION
// ============================================

export interface ResilienceConfig {
  rto: string; // Recovery Time Objective
  rpo: string; // Recovery Point Objective
  backupFrequency: string;
  backupRetention: string;
  pointInTimeRecovery: boolean;
}

export const RESILIENCE_CONFIG: ResilienceConfig = {
  rto: '1h', // 1 hour recovery time
  rpo: '5m', // 5 minute recovery point (max data loss)
  backupFrequency: 'hourly',
  backupRetention: '30d',
  pointInTimeRecovery: true,
};
