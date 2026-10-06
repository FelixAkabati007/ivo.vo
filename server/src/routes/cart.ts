import { Hono } from 'hono';
import { z } from 'zod';
import { cartService } from '../services/cart.service';

export const cartRouter = new Hono();

// Validation schemas
const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(10),
});

// GET /api/cart/:sessionId
cartRouter.get('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const cart = await cartService.getCart(sessionId);
  
  return c.json({
    success: true,
    data: cart,
  });
});

// POST /api/cart/:sessionId/items
cartRouter.post('/:sessionId/items', async (c) => {
  const sessionId = c.req.param('sessionId');
  const body = await c.req.json();
  const { productId, quantity } = addItemSchema.parse(body);
  
  const cart = await cartService.addItem(sessionId, productId, quantity);
  
  return c.json({
    success: true,
    data: cart,
  }, 201);
});

// PATCH /api/cart/:sessionId/items/:productId
cartRouter.patch('/:sessionId/items/:productId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const productId = c.req.param('productId');
  const body = await c.req.json();
  const { quantity } = updateQuantitySchema.parse(body);
  
  const cart = await cartService.updateQuantity(sessionId, productId, quantity);
  
  return c.json({
    success: true,
    data: cart,
  });
});

// DELETE /api/cart/:sessionId/items/:productId
cartRouter.delete('/:sessionId/items/:productId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const productId = c.req.param('productId');
  
  const cart = await cartService.removeItem(sessionId, productId);
  
  return c.json({
    success: true,
    data: cart,
  });
});

// DELETE /api/cart/:sessionId
cartRouter.delete('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  
  await cartService.clearCart(sessionId);
  
  return c.json({
    success: true,
    data: { message: 'Cart cleared' },
  });
});
