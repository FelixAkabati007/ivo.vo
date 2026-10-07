/**
 * Transactional Outbox Dispatcher
 * 
 * Publishes outbox events to n8n workflows.
 * Implements reliable event delivery with retries and dead-letter handling.
 */

import { db } from '../db';
import { outboxEvents } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';

export interface OutboxEvent {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  state: 'pending' | 'processing' | 'delivered' | 'failed';
  attemptCount: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
}

export interface DispatchConfig {
  n8nWebhookUrl: string;
  n8nWebhookSecret?: string;
  maxRetries: number;
  retryBackoffMs: number;
  batchSize: number;
}

const DEFAULT_CONFIG: DispatchConfig = {
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
  maxRetries: 5,
  retryBackoffMs: 1000,
  batchSize: 50,
};

/**
 * Outbox Dispatcher
 * Polls for pending events and dispatches them to n8n
 */
export class OutboxDispatcher {
  private config: DispatchConfig;
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DispatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the dispatcher polling loop
   */
  start(pollIntervalMs: number = 5000): void {
    if (this.isRunning) {
      console.warn('[OutboxDispatcher] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[OutboxDispatcher] Starting with poll interval:', pollIntervalMs);

    // Initial dispatch
    this.dispatchPendingEvents().catch(err => {
      console.error('[OutboxDispatcher] Initial dispatch error:', err);
    });

    // Set up polling
    this.pollInterval = setInterval(() => {
      this.dispatchPendingEvents().catch(err => {
        console.error('[OutboxDispatcher] Dispatch error:', err);
      });
    }, pollIntervalMs);
  }

  /**
   * Stop the dispatcher
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('[OutboxDispatcher] Stopped');
  }

  /**
   * Dispatch pending events
   */
  async dispatchPendingEvents(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Fetch pending events (ready for retry or new)
    const pendingEvents = await db
      .select()
      .from(outboxEvents)
      .where(
        and(
          eq(outboxEvents.state, 'pending'),
          sql`(${outboxEvents.nextRetryAt} IS NULL OR ${outboxEvents.nextRetryAt} <= NOW())`
        )
      )
      .orderBy(outboxEvents.createdAt)
      .limit(this.config.batchSize);

    if (pendingEvents.length === 0) {
      return;
    }

    console.log(`[OutboxDispatcher] Processing ${pendingEvents.length} events`);

    // Process each event
    for (const event of pendingEvents) {
      await this.processEvent(event);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: typeof outboxEvents.$inferSelect): Promise<void> {
    // Mark as processing
    await db
      .update(outboxEvents)
      .set({
        state: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(outboxEvents.id, event.id));

    try {
      // Dispatch to n8n
      await this.dispatchToN8n(event);

      // Mark as delivered
      await db
        .update(outboxEvents)
        .set({
          state: 'delivered',
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(outboxEvents.id, event.id));

      console.log(`[OutboxDispatcher] Event delivered: ${event.eventType} (${event.id})`);
    } catch (error) {
      await this.handleDispatchError(event, error);
    }
  }

  /**
   * Dispatch event to n8n webhook
   */
  private async dispatchToN8n(event: typeof outboxEvents.$inferSelect): Promise<void> {
    if (!this.config.n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured');
    }

    const payload = {
      eventId: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      payload: event.payload,
      createdAt: event.createdAt.toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Event-Type': event.eventType,
      'X-Event-Id': event.id,
    };

    // Add signature if secret is configured
    if (this.config.n8nWebhookSecret) {
      const signature = this.generateSignature(payload, this.config.n8nWebhookSecret);
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(this.config.n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook failed: ${response.status} ${errorText}`);
    }
  }

  /**
   * Handle dispatch error with retry logic
   */
  private async handleDispatchError(
    event: typeof outboxEvents.$inferSelect,
    error: any
  ): Promise<void> {
    const attemptCount = event.attemptCount + 1;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(
      `[OutboxDispatcher] Event dispatch failed (attempt ${attemptCount}):`,
      event.id,
      errorMessage
    );

    if (attemptCount >= this.config.maxRetries) {
      // Max retries reached - mark as failed (dead letter)
      await db
        .update(outboxEvents)
        .set({
          state: 'failed',
          attemptCount,
          lastError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(outboxEvents.id, event.id));

      console.error(
        `[OutboxDispatcher] Event failed after ${attemptCount} attempts (dead letter):`,
        event.id
      );

      // TODO: Send alert to monitoring system
      return;
    }

    // Calculate next retry time with exponential backoff + jitter
    const backoffMs = this.config.retryBackoffMs * Math.pow(2, attemptCount - 1);
    const jitter = Math.random() * 1000; // 0-1s jitter
    const nextRetryAt = new Date(Date.now() + backoffMs + jitter);

    // Update for retry
    await db
      .update(outboxEvents)
      .set({
        state: 'pending',
        attemptCount,
        nextRetryAt,
        lastError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(outboxEvents.id, event.id));
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const payloadStr = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');
  }

  /**
   * Manually retry failed events
   */
  async retryFailedEvents(eventIds?: string[]): Promise<number> {
    const query = db
      .update(outboxEvents)
      .set({
        state: 'pending',
        attemptCount: 0,
        nextRetryAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(outboxEvents.state, 'failed'));

    if (eventIds && eventIds.length > 0) {
      // Retry specific events
      // Note: This would need to be implemented with IN clause
      console.log('[OutboxDispatcher] Retrying specific events:', eventIds);
    }

    const result = await query.returning({ id: outboxEvents.id });
    console.log(`[OutboxDispatcher] Retried ${result.length} failed events`);
    return result.length;
  }

  /**
   * Get dispatcher statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    delivered: number;
    failed: number;
    totalAttempts: number;
  }> {
    const [stats] = await db
      .select({
        pending: sql<number>`COUNT(*) FILTER (WHERE state = 'pending')`,
        processing: sql<number>`COUNT(*) FILTER (WHERE state = 'processing')`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE state = 'delivered')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE state = 'failed')`,
        totalAttempts: sql<number>`SUM(attempt_count)`,
      })
      .from(outboxEvents);

    return {
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      delivered: stats.delivered || 0,
      failed: stats.failed || 0,
      totalAttempts: stats.totalAttempts || 0,
    };
  }
}

// Singleton instance
export const outboxDispatcher = new OutboxDispatcher();
