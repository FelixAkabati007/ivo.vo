import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { productsService } from '../services/products.service';
import { db } from '../db';
import { orders, products } from '../db/schema';
import { desc, sql } from 'drizzle-orm';

export const adminRouter = new Hono();

// All admin routes require authentication and admin role
adminRouter.use('*', authMiddleware);
adminRouter.use('*', adminMiddleware);

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  stockQuantity: z.number().int().min(0),
  imageUrl: z.string().url(),
  images: z.array(z.string().url()).optional(),
  features: z.array(z.string()).optional(),
  badge: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

// POST /api/admin/products
adminRouter.post('/products', async (c) => {
  const body = await c.req.json();
  const data = createProductSchema.parse(body);
  
  const product = await productsService.create(data);
  
  return c.json({
    success: true,
    data: product,
  }, 201);
});

// PUT /api/admin/products/:id
adminRouter.put('/products/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const data = updateProductSchema.parse(body);
  
  const product = await productsService.update(id, data);
  
  return c.json({
    success: true,
    data: product,
  });
});

// DELETE /api/admin/products/:id
adminRouter.delete('/products/:id', async (c) => {
  const id = c.req.param('id');
  
  await productsService.delete(id);
  
  return c.json({
    success: true,
    data: { message: 'Product deleted' },
  });
});

// GET /api/admin/orders
adminRouter.get('/orders', async (c) => {
  const ordersList = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(100);
  
  return c.json({
    success: true,
    data: ordersList,
  });
});

// GET /api/admin/analytics
adminRouter.get('/analytics', async (c) => {
  // Total revenue
  const [revenueResult] = await db
    .select({
      total: sql`COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0)`,
    })
    .from(orders)
    .where(sql`status != 'cancelled'`);
  
  // Total orders
  const [ordersResult] = await db
    .select({
      count: sql`COUNT(*)`,
    })
    .from(orders);
  
  // Total products
  const [productsResult] = await db
    .select({
      count: sql`COUNT(*)`,
    })
    .from(products)
    .where(sql`is_active = true`);
  
  // Low stock products
  const lowStock = await db
    .select()
    .from(products)
    .where(sql`stock_quantity < 10 AND is_active = true`)
    .limit(10);
  
  return c.json({
    success: true,
    data: {
      totalRevenue: parseFloat(revenueResult.total),
      totalOrders: parseInt(ordersResult.count),
      totalProducts: parseInt(productsResult.count),
      lowStockProducts: lowStock,
    },
  });
});
