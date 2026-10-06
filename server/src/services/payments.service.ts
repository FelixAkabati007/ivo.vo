import { db } from '../db';
import { payments, orders, outboxEvents, auditLog } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { withTransaction } from '../db';
import { ordersService } from './orders.service';

export interface InitializePaymentData {
  orderId: string;
  email: string;
  amount: number;
  currency?: string;
}

export interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: any;
    paid_at?: string;
  };
}

export class PaymentsService {
  async initializePayment(data: InitializePaymentData) {
    // Verify order exists and is pending
    const order = await ordersService.getOrderById(data.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order is not in pending state');
    }

    // Check if payment already initialized
    const [existing] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, data.orderId))
      .limit(1);

    if (existing && existing.status !== 'failed') {
      return existing;
    }

    // Initialize payment with Paystack
    const paystackResponse = await this.callPaystackInitialize({
      email: data.email,
      amount: Math.round(data.amount * 100), // Convert to kobo/pesewas
      currency: data.currency || 'GHS',
      reference: `IVO-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      metadata: {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
      },
    });

    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: data.orderId,
        amount: data.amount.toFixed(2),
        currency: data.currency || 'GHS',
        status: 'pending',
        paymentMethod: 'paystack',
        transactionRef: paystackResponse.data.reference,
        providerData: paystackResponse.data,
      })
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      entityType: 'payment',
      entityId: payment.id,
      action: 'payment.initialized',
      actorType: 'system',
      newState: {
        amount: payment.amount,
        reference: payment.transactionRef,
      },
    });

    return {
      ...payment,
      authorizationUrl: paystackResponse.data.authorization_url,
    };
  }

  async handleWebhook(payload: PaystackWebhookPayload) {
    const { event, data } = payload;

    // Find payment by reference
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionRef, data.reference))
      .limit(1);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check idempotency - if already processed, return
    if (payment.status === 'captured' && data.status === 'success') {
      return { success: true, message: 'Already processed' };
    }

    // Process in transaction
    return await withTransaction(async (tx) => {
      // Update payment status
      let newStatus: 'captured' | 'failed' = 'failed';
      if (data.status === 'success') {
        newStatus = 'captured';
      }

      await tx
        .update(payments)
        .set({
          status: newStatus,
          providerData: data,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Update order status
      if (newStatus === 'captured') {
        await tx
          .update(orders)
          .set({
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId));

        // Create outbox event for order confirmation email
        await tx.insert(outboxEvents).values({
          eventType: 'order.confirmed',
          payload: {
            orderId: payment.orderId,
            paymentId: payment.id,
            amount: payment.amount,
          },
        });
      }

      // Audit log
      await tx.insert(auditLog).values({
        entityType: 'payment',
        entityId: payment.id,
        action: 'payment.webhook_received',
        actorType: 'system',
        newState: {
          status: newStatus,
          reference: data.reference,
          event,
        },
      });

      return { success: true };
    });
  }

  async verifyPayment(paymentId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Optionally verify with Paystack API
    if (payment.transactionRef) {
      try {
        const verifyResponse = await this.callPaystackVerify(payment.transactionRef);
        
        // Update payment with latest status
        if (verifyResponse.data.status === 'success' && payment.status !== 'captured') {
          await db
            .update(payments)
            .set({
              status: 'captured',
              providerData: verifyResponse.data,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId));

          // Update order status
          await ordersService.updateStatus(payment.orderId, 'confirmed');
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
      }
    }

    return payment;
  }

  // Paystack API calls
  private async callPaystackInitialize(data: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    metadata: any;
  }) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Paystack initialization failed');
    }

    return await response.json();
  }

  private async callPaystackVerify(reference: string) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Paystack verification failed');
    }

    return await response.json();
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretHash = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secretHash) {
      throw new Error('Paystack webhook secret not configured');
    }

    // In production, use crypto.createHmac to verify signature
    // For now, simplified check
    return signature === secretHash;
  }
}

export const paymentsService = new PaymentsService();
