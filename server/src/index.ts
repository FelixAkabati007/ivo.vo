import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { productsRouter } from './routes/products';
import { cartRouter } from './routes/cart';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { requestLogger } from './middleware/request-logger';

const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

app.use('*', secureHeaders());
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', requestLogger());
app.use('*', rateLimiter());

// Error handling
app.onError(errorHandler);

// Routes - Versioned API (v1)
app.route('/api/v1/health', healthRouter);
app.route('/api/v1/auth', authRouter);
app.route('/api/v1/products', productsRouter);
app.route('/api/v1/categories', productsRouter); // Categories endpoint
app.route('/api/v1/search', productsRouter); // Search endpoint
app.route('/api/v1/cart', cartRouter);
app.route('/api/v1/checkout', ordersRouter); // Checkout quote endpoint
app.route('/api/v1/orders', ordersRouter);
app.route('/api/v1/webhooks', paymentsRouter); // Webhook endpoint
app.route('/api/v1/me', authRouter); // Account endpoints
app.route('/api/v1/admin', adminRouter);

// Legacy routes (redirect to v1)
app.route('/api/health', healthRouter);
app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);
app.route('/api/cart', cartRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/payments', paymentsRouter);
app.route('/api/admin', adminRouter);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  }, 404);
});

export default app;
export type AppType = typeof app;
