import { db } from '../db';
import { orders, orderItems, cartItems, products, outboxEvents, auditLog } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { withTransaction } from '../db';
import { productsService } from './products.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrderData {
  sessionId: string;
  userId?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  idempotencyKey: string;
}

export class OrdersService {
  async createOrder(data: CreateOrderData) {
    // Check idempotency
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, data.idempotencyKey))
      .limit(1);

    if (existing) {
      return existing;
    }

    // Get cart items
    const cartData = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, data.sessionId));

    if (cartData.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    const subtotal = cartData.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    const shippingCost = subtotal >= 50 ? 0 : 10; // Free shipping over 50 GHS
    const taxAmount = 0; // No tax for now
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order in transaction
    return await withTransaction(async (tx) => {
      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: data.userId,
          sessionId: data.sessionId,
          status: 'pending',
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          currency: 'GHS',
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          idempotencyKey: data.idempotencyKey,
        })
        .returning();

      // Create order items and decrement stock
      for (const item of cartData) {
        // Decrement stock
        await productsService.decrementStock(item.productId, item.quantity);

        // Create order item
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
        });
      }

      // Clear cart
      await tx
        .delete(cartItems)
        .where(eq(cartItems.sessionId, data.sessionId));

      // Create outbox event for n8n
      await tx.insert(outboxEvents).values({
        eventType: 'order.created',
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          email: data.shippingAddress.email,
          totalAmount: order.totalAmount,
        },
      });

      // Audit log
      await tx.insert(auditLog).values({
        entityType: 'order',
        entityId: order.id,
        action: 'order.created',
        actorType: data.userId ? 'user' : 'anonymous',
        actorId: data.userId,
        newState: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          itemCount: cartData.length,
        },
      });

      return order;
    });
  }

  async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const candidate = `IVO-${timestamp}-${random}`;

    // Check if exists
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, candidate))
      .limit(1);

    if (existing) {
      return this.generateOrderNumber(); // Retry
    }

    return candidate;
  }

  async getOrderById(orderId: string, userId?: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return null;
    }

    // Check authorization
    if (userId && order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return {
      ...order,
      items,
    };
  }

  async getOrdersBySession(sessionId: string) {
    const ordersList = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, sessionId))
      .orderBy(desc(orders.createdAt));

    return ordersList;
  }

  async getOrdersByUser(userId: string) {
    const ordersList = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return ordersList;
  }

  async updateStatus(orderId: string, status: string) {
    const [order] = await db
      .update(orders)
      .set({ 
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      entityType: 'order',
      entityId: orderId,
      action: 'order.status_changed',
      actorType: 'system',
      newState: { status },
    });

    return order;
  }
}

export const ordersService = new OrdersService();
