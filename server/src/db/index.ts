import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Database connection - SERVER SIDE ONLY
// This file must NEVER be imported by client-side code

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL environment variable is required');
}

// Create Neon client
export const sql: NeonQueryFunction = neon(process.env.NEON_DATABASE_URL);

// Create Drizzle ORM instance with schema
export const db = drizzle(sql, { schema });

// Health check function
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await sql`SELECT 1`;
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    return await fn(tx);
  });
}
