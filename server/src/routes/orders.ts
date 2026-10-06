import { Hono } from 'hono';
import { z } from 'zod';
import { ordersService } from '../services/orders.service';
import { authMiddleware, type AuthUser } from '../middleware/auth';

export const ordersRouter = new Hono();

// Validation schemas
const createOrderSchema = z.object({
  sessionId: z.string(),
  shippingAddress: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
  notes: z.string().optional(),
  idempotencyKey: z.string(),
});

// GET /api/orders
ordersRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const orders = await ordersService.getOrdersByUser(user.id);
  
  return c.json({
    success: true,
    data: orders,
  });
});

// POST /api/orders
ordersRouter.post('/', async (c) => {
  const body = await c.req.json();
  const data = createOrderSchema.parse(body);
  
  const order = await ordersService.createOrder(data);
  
  return c.json({
    success: true,
    data: order,
  }, 201);
});

// GET /api/orders/:id
ordersRouter.get('/:id', authMiddleware, async (c) => {
  const orderId = c.req.param('id');
  const user = c.get('user') as AuthUser;
  
  const order = await ordersService.getOrderById(orderId, user.id);
  
  if (!order) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Order not found',
      },
    }, 404);
  }
  
  return c.json({
    success: true,
    data: order,
  });
});

// GET /api/orders/session/:sessionId
ordersRouter.get('/session/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const orders = await ordersService.getOrdersBySession(sessionId);
  
  return c.json({
    success: true,
    data: orders,
  });
});
