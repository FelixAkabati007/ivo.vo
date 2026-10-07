/**
 * Feature Flags - Controlled Feature Rollouts
 * 
 * Implements feature flag system for ivo Electronics:
 * - Runtime feature toggles
 * - Gradual rollouts
 * - A/B testing support
 * - Environment-based flags
 * - User segment targeting
 */

import { createHash } from 'crypto';

// ============================================
// FEATURE FLAG DEFINITIONS
// ============================================

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  segments?: string[]; // User segments
  environment?: string[]; // Environments where enabled
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Checkout features
  'checkout.guest_enabled': {
    key: 'checkout.guest_enabled',
    name: 'Guest Checkout',
    description: 'Allow customers to checkout without creating an account',
    enabled: true,
    rolloutPercentage: 100,
    owner: 'product-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'checkout.multi_address': {
    key: 'checkout.multi_address',
    name: 'Multi-Address Checkout',
    description: 'Allow different shipping addresses for different items',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'product-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Payment features
  'payment.mobile_money': {
    key: 'payment.mobile_money',
    name: 'Mobile Money Payments',
    description: 'Enable mobile money payment options',
    enabled: true,
    rolloutPercentage: 100,
    owner: 'payments-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'payment.installments': {
    key: 'payment.installments',
    name: 'Installment Payments',
    description: 'Allow customers to pay in installments',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'payments-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // AI features
  'ai.product_search': {
    key: 'ai.product_search',
    name: 'AI Product Search',
    description: 'Enable AI-powered natural language product search',
    enabled: true,
    rolloutPercentage: 100,
    owner: 'ai-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'ai.support_triage': {
    key: 'ai.support_triage',
    name: 'AI Support Triage',
    description: 'Enable AI-powered support ticket classification',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'ai-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // UI features
  'ui.dark_mode': {
    key: 'ui.dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode theme',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'design-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'ui.wishlist': {
    key: 'ui.wishlist',
    name: 'Wishlist Feature',
    description: 'Enable wishlist functionality',
    enabled: true,
    rolloutPercentage: 100,
    owner: 'design-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Experimental features
  'experimental.recommendations': {
    key: 'experimental.recommendations',
    name: 'Product Recommendations',
    description: 'AI-powered product recommendations',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'product-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'experimental.loyalty_program': {
    key: 'experimental.loyalty_program',
    name: 'Loyalty Program',
    description: 'Customer loyalty and rewards program',
    enabled: false,
    rolloutPercentage: 0,
    owner: 'product-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// ============================================
// FEATURE FLAG SERVICE
// ============================================

export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  segment?: string;
  environment?: string;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    // Initialize with default flags
    Object.values(FEATURE_FLAGS).forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  /**
   * Check if a feature is enabled for a given context
   */
  isEnabled(flagKey: string, context: FeatureFlagContext = {}): boolean {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      console.warn(`Feature flag not found: ${flagKey}`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment restriction
    if (flag.environment && flag.environment.length > 0) {
      const currentEnv = context.environment || process.env.NODE_ENV || 'development';
      if (!flag.environment.includes(currentEnv)) {
        return false;
      }
    }

    // Check segment restriction
    if (flag.segments && flag.segments.length > 0 && context.segment) {
      if (!flag.segments.includes(context.segment)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const identifier = context.userId || context.sessionId || 'anonymous';
      const hash = this.hashIdentifier(identifier, flagKey);
      const percentage = (hash % 100);
      
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific feature flag
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Update a feature flag
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      throw new Error(`Feature flag not found: ${flagKey}`);
    }

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.flags.set(flagKey, updatedFlag);
  }

  /**
   * Enable a feature flag
   */
  enableFlag(flagKey: string, rolloutPercentage: number = 100): void {
    this.updateFlag(flagKey, {
      enabled: true,
      rolloutPercentage,
    });
  }

  /**
   * Disable a feature flag
   */
  disableFlag(flagKey: string): void {
    this.updateFlag(flagKey, {
      enabled: false,
      rolloutPercentage: 0,
    });
  }

  /**
   * Gradually roll out a feature
   */
  setRolloutPercentage(flagKey: string, percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    this.updateFlag(flagKey, {
      rolloutPercentage: percentage,
      enabled: percentage > 0,
    });
  }

  /**
   * Hash identifier for consistent rollout
   */
  private hashIdentifier(identifier: string, flagKey: string): number {
    const hash = createHash('md5')
      .update(`${identifier}:${flagKey}`)
      .digest('hex');
    
    // Convert first 8 chars to number and mod by 100
    return parseInt(hash.substring(0, 8), 16) % 100;
  }

  /**
   * Get feature flags for a specific context
   */
  getEnabledFlags(context: FeatureFlagContext = {}): string[] {
    const enabled: string[] = [];
    
    for (const [key] of this.flags) {
      if (this.isEnabled(key, context)) {
        enabled.push(key);
      }
    }
    
    return enabled;
  }

  /**
   * Check multiple flags at once
   */
  checkFlags(flagKeys: string[], context: FeatureFlagContext = {}): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    for (const key of flagKeys) {
      results[key] = this.isEnabled(key, context);
    }
    
    return results;
  }
}

export const featureFlagService = new FeatureFlagService();

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Feature flag middleware for Hono
 */
export function featureFlagMiddleware(flagKey: string) {
  return async (c: any, next: any) => {
    const context: FeatureFlagContext = {
      userId: c.get('userId'),
      sessionId: c.get('sessionId'),
      environment: process.env.NODE_ENV,
    };

    if (!featureFlagService.isEnabled(flagKey, context)) {
      return c.json({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: `Feature '${flagKey}' is not enabled`,
        },
      }, 403);
    }

    await next();
  };
}

// ============================================
// ANALYTICS TRACKING
// ============================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

/**
 * Privacy-conscious analytics tracking
 * 
 * IMPORTANT: Never send PII to analytics by default
 */
class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private batchSize = 100;
  private flushInterval = 60000; // 1 minute

  constructor() {
    // Auto-flush events periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Track an analytics event
   */
  track(eventName: string, properties: Record<string, any> = {}, context: { userId?: string; sessionId?: string } = {}): void {
    // Sanitize properties - remove PII
    const sanitized = this.sanitizeProperties(properties);

    const event: AnalyticsEvent = {
      name: eventName,
      properties: sanitized,
      userId: context.userId,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('page_view', { path }, context);
  }

  /**
   * Track product view
   */
  trackProductView(productId: string, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('product_view', { productId }, context);
  }

  /**
   * Track cart addition
   */
  trackCartAdd(productId: string, quantity: number, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('cart_add', { productId, quantity }, context);
  }

  /**
   * Track checkout start
   */
  trackCheckoutStart(orderId: string, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('checkout_start', { orderId }, context);
  }

  /**
   * Track checkout completion
   */
  trackCheckoutComplete(orderId: string, total: number, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('checkout_complete', { orderId, total }, context);
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultCount: number, context: { userId?: string; sessionId?: string } = {}): void {
    this.track('search', { query, resultCount }, context);
  }

  /**
   * Sanitize properties to remove PII
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties };
    
    // Remove common PII fields
    const piiFields = ['email', 'phone', 'address', 'name', 'password', 'creditCard'];
    
    for (const field of piiFields) {
      if (sanitized[field] !== undefined) {
        delete sanitized[field];
      }
    }
    
    return sanitized;
  }

  /**
   * Flush events to analytics service
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // In production, send to analytics service
      // For now, just log
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] Flushing ${eventsToSend.length} events`);
      }

      // TODO: Implement actual analytics service integration
      // await analyticsService.send(eventsToSend);
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  /**
   * Get pending event count
   */
  getPendingCount(): number {
    return this.events.length;
  }
}

export const analyticsTracker = new AnalyticsTracker();
