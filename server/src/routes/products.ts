import { Hono } from 'hono';
import { z } from 'zod';
import { productsService } from '../services/products.service';

export const productsRouter = new Hono();

// Validation schemas
const getProductsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// GET /api/products
productsRouter.get('/', async (c) => {
  const query = c.req.query();
  const filters = getProductsSchema.parse(query);
  
  const products = await productsService.getAll(filters);
  
  return c.json({
    success: true,
    data: products,
  });
});

// GET /api/products/categories
productsRouter.get('/categories', async (c) => {
  const categories = await productsService.getCategories();
  
  return c.json({
    success: true,
    data: categories,
  });
});

// GET /api/products/:id
productsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const product = await productsService.getById(id);
  
  if (!product) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found',
      },
    }, 404);
  }
  
  return c.json({
    success: true,
    data: product,
  });
});

// GET /api/products/slug/:slug
productsRouter.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const product = await productsService.getBySlug(slug);
  
  if (!product) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found',
      },
    }, 404);
  }
  
  return c.json({
    success: true,
    data: product,
  });
});
