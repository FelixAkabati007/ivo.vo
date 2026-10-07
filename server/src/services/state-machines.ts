import { db } from '../db';
import { orders, orderStatusHistory, orderItems, productVariants, inventory, stockReservations, outboxEvents, idempotencyKeys } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// ============================================
// ORDER STATE MACHINE
// ============================================

export type OrderStatus = 
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'fulfilled'
  | 'payment_failed'
  | 'cancelled'
  | 'partially_fulfilled'
  | 'refunded'
  | 'partially_refunded'
  | 'requires_review';

// Valid state transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'payment_failed', 'cancelled'],
  paid: ['processing', 'cancelled', 'requires_review'],
  processing: ['fulfilled', 'partially_fulfilled', 'cancelled', 'requires_review'],
  fulfilled: ['refunded', 'partially_refunded'],
  payment_failed: ['pending_payment', 'cancelled'],
  cancelled: [], // Terminal state
  partially_fulfilled: ['fulfilled', 'refunded', 'partially_refunded'],
  refunded: [], // Terminal state
  partially_refunded: ['refunded'],
  requires_review: ['paid', 'processing', 'cancelled'],
};

export interface OrderTransitionRequest {
  orderId: string;
  newStatus: OrderStatus;
  actorId?: string;
  actorType: 'user' | 'system' | 'admin';
  reason?: string;
  metadata?: Record<string, any>;
}

export class OrderStateMachine {
  /**
   * Transition order to a new status
   */
  async transition(request: OrderTransitionRequest): Promise<void> {
    const { orderId, newStatus, actorId, actorType, reason, metadata } = request;

    // Get current order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.status as OrderStatus;

    // Validate transition
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid state transition: ${currentStatus} → ${newStatus}`
      );
    }

    // Perform transition in transaction
    await db.transaction(async (tx) => {
      // Update order status
      await tx
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Record status history
      await tx.insert(orderStatusHistory).values({
        orderId,
        oldStatus: currentStatus,
        newStatus,
        actorId,
        actorType,
        reason,
        metadata,
      });

      // Handle side effects based on transition
      await this.handleTransitionSideEffects(tx, orderId, currentStatus, newStatus);
    });
  }

  /**
   * Handle side effects of state transitions
   */
  private async handleTransitionSideEffects(
    tx: any,
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): Promise<void> {
    // Release reservations when cancelling
    if (toStatus === 'cancelled' && fromStatus !== 'cancelled') {
      await this.releaseReservations(tx, orderId);
    }

    // Create outbox events for notifications
    if (toStatus === 'paid') {
      await tx.insert(outboxEvents).values({
        eventType: 'order.paid',
        aggregateId: orderId,
        aggregateType: 'order',
        payload: { orderId, status: toStatus },
      });
    }

    if (toStatus === 'fulfilled') {
      await tx.insert(outboxEvents).values({
        eventType: 'order.fulfilled',
        aggregateId: orderId,
        aggregateType: 'order',
        payload: { orderId, status: toStatus },
      });
    }
  }

  /**
   * Release stock reservations for an order
   */
  private async releaseReservations(tx: any, orderId: string): Promise<void> {
    // Get active reservations
    const reservations = await tx
      .select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.orderId, orderId),
          eq(stockReservations.status, 'active')
        )
      );

    for (const reservation of reservations) {
      // Release reservation
      await tx
        .update(stockReservations)
        .set({
          status: 'released',
          updatedAt: new Date(),
        })
        .where(eq(stockReservations.id, reservation.id));

      // Release inventory
      await tx
        .update(inventory)
        .set({
          reserved: sql`reserved - ${reservation.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, reservation.inventoryId));
    }
  }

  /**
   * Get valid next states for an order
   */
  async getValidNextStates(orderId: string): Promise<OrderStatus[]> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.status as OrderStatus;
    return VALID_TRANSITIONS[currentStatus] || [];
  }
}

// ============================================
// PAYMENT STATE MACHINE
// ============================================

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded'
  | 'disputed';

const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  created: ['pending', 'failed', 'cancelled'],
  pending: ['succeeded', 'failed', 'cancelled'],
  succeeded: ['refund_pending', 'refunded', 'disputed'],
  failed: [], // Terminal state
  cancelled: [], // Terminal state
  refund_pending: ['refunded', 'partially_refunded', 'succeeded'],
  partially_refunded: ['refunded'],
  refunded: [], // Terminal state
  disputed: ['refunded'],
};

export interface PaymentTransitionRequest {
  paymentAttemptId: string;
  newStatus: PaymentStatus;
  providerEventId?: string;
  eventData?: Record<string, any>;
}

export class PaymentStateMachine {
  /**
   * Transition payment to a new status
   */
  async transition(request: PaymentTransitionRequest): Promise<void> {
    const { paymentAttemptId, newStatus, providerEventId, eventData } = request;

    // Get current payment
    const [payment] = await db
      .select()
      .from(paymentAttempts)
      .where(eq(paymentAttempts.id, paymentAttemptId))
      .limit(1);

    if (!payment) {
      throw new Error('Payment attempt not found');
    }

    const currentStatus = payment.status as PaymentStatus;

    // Validate transition
    if (!VALID_PAYMENT_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid payment state transition: ${currentStatus} → ${newStatus}`
      );
    }

    // Perform transition in transaction
    await db.transaction(async (tx) => {
      // Update payment status
      await tx
        .update(paymentAttempts)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(paymentAttempts.id, paymentAttemptId));

      // Record payment event if provided
      if (providerEventId) {
        await tx.insert(paymentEvents).values({
          paymentAttemptId,
          providerEventId,
          eventType: `payment.${newStatus}`,
          eventData: eventData || {},
          processingStatus: 'completed',
          receivedAt: new Date(),
          processedAt: new Date(),
        });
      }
    });
  }

  /**
   * Get valid next states for a payment
   */
  async getValidNextStates(paymentAttemptId: string): Promise<PaymentStatus[]> {
    const [payment] = await db
      .select()
      .from(paymentAttempts)
      .where(eq(paymentAttempts.id, paymentAttemptId))
      .limit(1);

    if (!payment) {
      throw new Error('Payment attempt not found');
    }

    const currentStatus = payment.status as PaymentStatus;
    return VALID_PAYMENT_TRANSITIONS[currentStatus] || [];
  }
}

// ============================================
// SINGLETONS
// ============================================

export const orderStateMachine = new OrderStateMachine();
export const paymentStateMachine = new PaymentStateMachine();
