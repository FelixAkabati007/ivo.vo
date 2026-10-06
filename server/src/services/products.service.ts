import { db } from '../db';
import { products } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  limit?: number;
  offset?: number;
}

export class ProductsService {
  async getAll(filters: ProductFilters = {}) {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      limit = 20,
      offset = 0,
    } = filters;

    let query = db.select().from(products).where(eq(products.isActive, true));

    if (category) {
      query = query.and(eq(products.category, category)) as any;
    }

    if (search) {
      query = query.and(
        sql`${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`}`
      ) as any;
    }

    if (minPrice !== undefined) {
      query = query.and(sql`${products.price} >= ${minPrice}`) as any;
    }

    if (maxPrice !== undefined) {
      query = query.and(sql`${products.price} <= ${maxPrice}`) as any;
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.orderBy(products.price) as any;
        break;
      case 'price_desc':
        query = query.orderBy(desc(products.price)) as any;
        break;
      case 'rating':
        query = query.orderBy(desc(products.rating)) as any;
        break;
      default:
        query = query.orderBy(desc(products.createdAt)) as any;
    }

    return await query.limit(limit).offset(offset);
  }

  async getById(id: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);

    return product || null;
  }

  async getBySlug(slug: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    return product || null;
  }

  async getCategories() {
    const result = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.isActive, true))
      .groupBy(products.category);

    return result.map(r => r.category);
  }

  async create(data: {
    name: string;
    slug: string;
    category: string;
    description?: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    stockQuantity: number;
    imageUrl: string;
    images?: string[];
    features?: string[];
    badge?: string;
  }) {
    const [product] = await db
      .insert(products)
      .values({
        ...data,
        currency: data.currency || 'GHS',
      })
      .returning();

    return product;
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    stockQuantity: number;
    imageUrl: string;
    images: string[];
    features: string[];
    badge: string;
    isActive: boolean;
  }>) {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return product;
  }

  async delete(id: string) {
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  async decrementStock(productId: string, quantity: number) {
    const [product] = await db
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, productId),
        sql`${products.stockQuantity} >= ${quantity}`
      ))
      .returning();

    if (!product) {
      throw new Error('Insufficient stock');
    }

    return product;
  }
}

export const productsService = new ProductsService();
