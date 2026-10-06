/**
 * Observability Module
 * 
 * Provides structured logging, metrics, and tracing for the application.
 * Enables monitoring, debugging, and performance analysis.
 * 
 * Principle: "Production readiness must be demonstrated with evidence"
 */

// ============================================
// TYPES
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
}

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ok' | 'error';
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string }>;
}

// ============================================
// LOGGING
// ============================================

const LOG_STORAGE_KEY = 'ivo_logs';
const MAX_LOG_ENTRIES = 500;

let currentTraceId: string | null = null;
let currentSpanId: string | null = null;

/**
 * Log a message with structured context
 */
export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    traceId: currentTraceId || undefined,
    spanId: currentSpanId || undefined,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  // Store locally
  storeLog(entry);

  // Console output
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  const prefix = `[${level.toUpperCase()}]`;
  
  if (error) {
    console[consoleMethod](`${prefix} ${message}`, context, error);
  } else if (context) {
    console[consoleMethod](`${prefix} ${message}`, context);
  } else {
    console[consoleMethod](`${prefix} ${message}`);
  }

  // Send to server in production
  if (import.meta.env.PROD && import.meta.env.VITE_API_BASE_URL) {
    sendLogToServer(entry).catch(() => {
      // Silently fail - don't break the app
    });
  }
}

/**
 * Log debug message
 */
export function debug(message: string, context?: Record<string, any>): void {
  log('debug', message, context);
}

/**
 * Log info message
 */
export function info(message: string, context?: Record<string, any>): void {
  log('info', message, context);
}

/**
 * Log warning message
 */
export function warn(message: string, context?: Record<string, any>): void {
  log('warn', message, context);
}

/**
 * Log error message
 */
export function error(message: string, error?: Error, context?: Record<string, any>): void {
  log('error', message, context, error);
}

// ============================================
// METRICS
// ============================================

const metricsBuffer: Metric[] = [];
const METRICS_FLUSH_INTERVAL = 10000; // 10 seconds

/**
 * Record a metric
 */
export function metric(name: string, value: number, tags?: Record<string, string>): void {
  const m: Metric = {
    name,
    value,
    tags,
    timestamp: new Date().toISOString(),
  };

  metricsBuffer.push(m);

  // Console output in development
  if (import.meta.env.DEV) {
    console.log(`[METRIC] ${name}: ${value}`, tags);
  }
}

/**
 * Record a timing metric
 */
export function timing(name: string, durationMs: number, tags?: Record<string, string>): void {
  metric(`${name}.duration`, durationMs, tags);
}

/**
 * Record a counter metric
 */
export function counter(name: string, tags?: Record<string, string>): void {
  metric(`${name}.count`, 1, tags);
}

/**
 * Flush metrics to server
 */
export async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;

  const metricsToSend = [...metricsBuffer];
  metricsBuffer.length = 0;

  if (import.meta.env.VITE_API_BASE_URL) {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
        keepalive: true,
      });
    } catch (error) {
      // Re-add metrics to buffer if send fails
      metricsBuffer.unshift(...metricsToSend);
      console.error('Failed to flush metrics:', error);
    }
  }
}

// Auto-flush metrics periodically
if (typeof window !== 'undefined') {
  setInterval(flushMetrics, METRICS_FLUSH_INTERVAL);
}

// ============================================
// TRACING
// ============================================

const activeSpans: Map<string, Span> = new Map();

/**
 * Start a new trace
 */
export function startTrace(operationName: string): string {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  currentTraceId = traceId;
  currentSpanId = spanId;

  const span: Span = {
    traceId,
    spanId,
    operationName,
    startTime: performance.now(),
    status: 'ok',
    tags: {},
    logs: [],
  };

  activeSpans.set(spanId, span);

  return traceId;
}

/**
 * Start a child span
 */
export function startSpan(operationName: string, parentSpanId?: string): string {
  const spanId = generateSpanId();

  const span: Span = {
    traceId: currentTraceId || generateTraceId(),
    spanId,
    parentSpanId: parentSpanId || currentSpanId || undefined,
    operationName,
    startTime: performance.now(),
    status: 'ok',
    tags: {},
    logs: [],
  };

  activeSpans.set(spanId, span);
  currentSpanId = spanId;

  return spanId;
}

/**
 * End a span
 */
export function endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  span.endTime = performance.now();
  span.duration = span.endTime - span.startTime;
  span.status = status;

  // Log the span
  info(`Span completed: ${span.operationName}`, {
    traceId: span.traceId,
    spanId: span.spanId,
    duration: span.duration,
    status: span.status,
  });

  // Record timing metric
  timing(span.operationName, span.duration);

  activeSpans.delete(spanId);

  // Restore parent span
  if (span.parentSpanId) {
    currentSpanId = span.parentSpanId;
  }
}

/**
 * Add a tag to the current span
 */
export function addSpanTag(key: string, value: any): void {
  if (!currentSpanId) return;
  const span = activeSpans.get(currentSpanId);
  if (span) {
    span.tags[key] = value;
  }
}

/**
 * Add a log to the current span
 */
export function addSpanLog(message: string): void {
  if (!currentSpanId) return;
  const span = activeSpans.get(currentSpanId);
  if (span) {
    span.logs.push({
      timestamp: performance.now(),
      message,
    });
  }
}

/**
 * End the current trace
 */
export function endTrace(): void {
  currentTraceId = null;
  currentSpanId = null;
}

// ============================================
// HELPERS
// ============================================

function storeLog(entry: LogEntry): void {
  try {
    const existing = getStoredLogs();
    existing.push(entry);

    if (existing.length > MAX_LOG_ENTRIES) {
      existing.splice(0, existing.length - MAX_LOG_ENTRIES);
    }

    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to store log:', error);
  }
}

function getStoredLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function sendLogToServer(entry: LogEntry): Promise<void> {
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
    keepalive: true,
  });
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSpanId(): string {
  return `span_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// PERFORMANCE OBSERVER
// ============================================

if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  // Monitor long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, {
          startTime: entry.startTime,
          duration: entry.duration,
        });
        metric('performance.long_task', entry.duration);
      }
    }
  });

  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch {
    // longtask not supported in all browsers
  }

  // Monitor resource loading
  const resourceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        warn(`Slow resource: ${entry.name}`, {
          duration: entry.duration,
          type: (entry as any).initiatorType,
        });
        metric('performance.slow_resource', entry.duration, {
          resource: entry.name,
        });
      }
    }
  });

  try {
    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch {
    // resource not supported
  }
}
