import { Hono } from 'hono';
import { z } from 'zod';
import { paymentsService, type PaystackWebhookPayload } from '../services/payments.service';

export const paymentsRouter = new Hono();

// Validation schemas
const initializePaymentSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email(),
});

// POST /api/payments/initialize
paymentsRouter.post('/initialize', async (c) => {
  const body = await c.req.json();
  const { orderId, email } = initializePaymentSchema.parse(body);
  
  // Get order to determine amount
  const { ordersService } = await import('../services/orders.service');
  const order = await ordersService.getOrderById(orderId);
  
  if (!order) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Order not found',
      },
    }, 404);
  }
  
  const payment = await paymentsService.initializePayment({
    orderId,
    email,
    amount: parseFloat(order.totalAmount),
    currency: order.currency,
  });
  
  return c.json({
    success: true,
    data: payment,
  });
});

// POST /api/payments/webhook
paymentsRouter.post('/webhook', async (c) => {
  // Verify webhook signature
  const signature = c.req.header('x-paystack-signature');
  if (!signature) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing webhook signature',
      },
    }, 401);
  }
  
  const payload = await c.req.text();
  
  // Verify signature (in production, use proper HMAC verification)
  const isValid = paymentsService.verifyWebhookSignature(payload, signature);
  if (!isValid) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid webhook signature',
      },
    }, 401);
  }
  
  const webhookPayload: PaystackWebhookPayload = JSON.parse(payload);
  
  try {
    await paymentsService.handleWebhook(webhookPayload);
    
    return c.json({
      success: true,
      data: { message: 'Webhook processed' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// GET /api/payments/:id/verify
paymentsRouter.get('/:id/verify', async (c) => {
  const paymentId = c.req.param('id');
  
  const payment = await paymentsService.verifyPayment(paymentId);
  
  return c.json({
    success: true,
    data: payment,
  });
});
