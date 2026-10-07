import { Hono } from 'hono';
import { checkDatabaseHealth } from '../db';

export const healthRouter = new Hono();

// GET /api/health
healthRouter.get('/', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  
  const status = dbHealth.connected ? 'healthy' : 'unhealthy';
  const httpStatus = dbHealth.connected ? 200 : 503;
  
  return c.json({
    success: dbHealth.connected,
    data: {
      status,
      database: dbHealth.connected ? 'connected' : 'disconnected',
      latency: dbHealth.latency,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    error: dbHealth.error ? {
      code: 'DATABASE_ERROR',
      message: dbHealth.error,
    } : undefined,
  }, httpStatus);
});
