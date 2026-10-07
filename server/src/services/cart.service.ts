import { db } from '../db';
import { cartItems, products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { productsService } from './products.service';

export class CartService {
  async getCart(sessionId: string) {
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, sessionId));

    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    return {
      sessionId,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: parseFloat(item.product.price),
          imageUrl: item.product.imageUrl,
          stockQuantity: item.product.stockQuantity,
        },
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      currency: items[0]?.product.currency || 'GHS',
    };
  }

  async addItem(sessionId: string, productId: string, quantity: number) {
    // Validate product exists and has stock
    const product = await productsService.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.productId, productId)
      ))
      .limit(1);

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + quantity;
      
      if (product.stockQuantity < newQuantity) {
        throw new Error('Insufficient stock');
      }

      await db
        .update(cartItems)
        .set({ 
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        sessionId,
        productId,
        quantity,
      });
    }

    return await this.getCart(sessionId);
  }

  async updateQuantity(sessionId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      return await this.removeItem(sessionId, productId);
    }

    // Validate stock
    const product = await productsService.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date(),
      })
      .where(and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.productId, productId)
      ));

    return await this.getCart(sessionId);
  }

  async removeItem(sessionId: string, productId: string) {
    await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.productId, productId)
      ));

    return await this.getCart(sessionId);
  }

  async clearCart(sessionId: string) {
    await db
      .delete(cartItems)
      .where(eq(cartItems.sessionId, sessionId));

    return {
      sessionId,
      items: [],
      subtotal: 0,
      currency: 'GHS',
    };
  }
}

export const cartService = new CartService();
