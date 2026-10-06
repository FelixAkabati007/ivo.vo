/**
 * Neon Database Client Configuration
 * 
 * Uses @neondatabase/serverless for HTTP-based connections
 * to Neon's serverless PostgreSQL. Supports:
 * - Connection pooling via Neon's built-in pooler
 * - HTTP fetch mode for edge/browser compatibility
 * - Automatic retry logic with exponential backoff
 * - Query timeout enforcement
 */

import { neon } from '@neondatabase/serverless';

// Neon connection configuration
export interface NeonConfig {
  connectionString: string;
  poolSize?: number;
  idleTimeout?: number;
  queryTimeout?: number;
  maxRetries?: number;
}

// Default configuration
const DEFAULT_CONFIG: NeonConfig = {
  connectionString: '',
  poolSize: 10,
  idleTimeout: 30000,
  queryTimeout: 10000,
  maxRetries: 3,
};

// Get configuration from environment
function getConfig(): NeonConfig {
  return {
    ...DEFAULT_CONFIG,
    connectionString: import.meta.env.VITE_NEON_DATABASE_URL || '',
  };
}

// Connection state
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  lastConnectedAt: Date | null;
  queryCount: number;
  latency: number | null;
}

let connectionState: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  lastError: null,
  lastConnectedAt: null,
  queryCount: 0,
  latency: null,
};

let sqlClient: ReturnType<typeof neon> | null = null;

/**
 * Initialize the Neon database connection
 */
export function initializeNeon(): boolean {
  const config = getConfig();
  
  if (!config.connectionString) {
    connectionState.lastError = 'No Neon database URL configured';
    connectionState.isConnected = false;
    return false;
  }

  try {
    sqlClient = neon(config.connectionString);
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.lastConnectedAt = new Date();
    connectionState.lastError = null;
    return true;
  } catch (error) {
    connectionState.lastError = error instanceof Error ? error.message : 'Unknown error';
    connectionState.isConnected = false;
    return false;
  }
}

/**
 * Execute a query using tagged template literal with retry logic
 */
export async function executeQuery<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  if (!sqlClient) {
    throw new Error('Neon client not initialized');
  }

  const config = getConfig();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries!; attempt++) {
    try {
      const startTime = performance.now();
      
      // Execute with timeout
      const result = await Promise.race([
        sqlClient(strings, ...values),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), config.queryTimeout)
        )
      ]) as T[];

      const latency = performance.now() - startTime;
      connectionState.queryCount++;
      connectionState.latency = latency;
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown query error');
      
      // Retry with exponential backoff
      if (attempt < config.maxRetries! - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      break;
    }
  }

  throw lastError || new Error('Query failed');
}

/**
 * Test the database connection
 */
export async function testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
  if (!sqlClient) {
    return { success: false, latency: 0, error: 'Client not initialized' };
  }

  try {
    const startTime = performance.now();
    const strings = Object.assign(['SELECT 1'], { raw: ['SELECT 1'] }) as unknown as TemplateStringsArray;
    await executeQuery(strings);
    const latency = performance.now() - startTime;
    
    connectionState.isConnected = true;
    connectionState.lastConnectedAt = new Date();
    
    return { success: true, latency };
  } catch (error) {
    connectionState.isConnected = false;
    connectionState.lastError = error instanceof Error ? error.message : 'Connection failed';
    return { 
      success: false, 
      latency: 0, 
      error: connectionState.lastError || undefined 
    };
  }
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return { ...connectionState };
}

/**
 * Check if Neon is configured and available
 */
export function isNeonConfigured(): boolean {
  const config = getConfig();
  return !!config.connectionString;
}

/**
 * Get the SQL client for direct queries
 */
export function getSqlClient() {
  return sqlClient;
}

// Auto-initialize on import if configured
if (isNeonConfigured()) {
  initializeNeon();
}
