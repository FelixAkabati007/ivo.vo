import { db } from '../db';
import { promotions, promotionUsage, priceHistory, productVariants, products } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// PROMOTION TYPES
// ============================================

export type PromotionType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';

export interface CartItem {
  variantId: string;
  productId: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
}

export interface PromotionEligibility {
  eligible: boolean;
  reason?: string;
  discountAmount: number;
  appliedPromotions: Array<{
    promotionId: string;
    code: string;
    type: PromotionType;
    discountAmount: number;
  }>;
}

// ============================================
// PROMOTIONS SERVICE
// ============================================

export class PromotionsService {
  /**
   * Validate and apply promotion code
   */
  async validatePromotionCode(
    code: string,
    cartItems: CartItem[],
    userId?: string,
    sessionId?: string
  ): Promise<PromotionEligibility> {
    // Find promotion by code
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.code, code),
          eq(promotions.isActive, true)
        )
      )
      .limit(1);

    if (!promotion) {
      return {
        eligible: false,
        reason: 'Invalid promotion code',
        discountAmount: 0,
        appliedPromotions: [],
      };
    }

    return await this.checkPromotionEligibility(promotion, cartItems, userId, sessionId);
  }

  /**
   * Check if promotion is eligible for cart
   */
  async checkPromotionEligibility(
    promotion: typeof promotions.$inferSelect,
    cartItems: CartItem[],
    userId?: string,
    sessionId?: string
  ): Promise<PromotionEligibility> {
    const now = new Date();

    // Check date range
    if (now < promotion.startDate || now > promotion.endDate) {
      return {
        eligible: false,
        reason: 'Promotion has expired or not yet started',
        discountAmount: 0,
        appliedPromotions: [],
      };
    }

    // Check usage limits
    if (promotion.usageLimit) {
      const [usageCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(promotionUsage)
        .where(eq(promotionUsage.promotionId, promotion.id));

      if (usageCount.count >= promotion.usageLimit) {
        return {
          eligible: false,
          reason: 'Promotion usage limit reached',
          discountAmount: 0,
          appliedPromotions: [],
        };
      }
    }

    // Check per-user limit
    if (promotion.usageLimitPerUser && (userId || sessionId)) {
      const userUsageQuery = userId
        ? eq(promotionUsage.userId, userId)
        : eq(promotionUsage.sessionId, sessionId!);

      const [userUsageCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(promotionUsage)
        .where(
          and(
            eq(promotionUsage.promotionId, promotion.id),
            userUsageQuery
          )
        );

      if (userUsageCount.count >= promotion.usageLimitPerUser) {
        return {
          eligible: false,
          reason: 'You have already used this promotion',
          discountAmount: 0,
          appliedPromotions: [],
        };
      }
    }

    // Filter applicable items
    const applicableItems = this.filterApplicableItems(promotion, cartItems);

    if (applicableItems.length === 0) {
      return {
        eligible: false,
        reason: 'No applicable items in cart',
        discountAmount: 0,
        appliedPromotions: [],
      };
    }

    // Calculate subtotal of applicable items
    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Check minimum purchase
    if (promotion.minimumPurchase && applicableSubtotal < parseFloat(promotion.minimumPurchase)) {
      return {
        eligible: false,
        reason: `Minimum purchase of ${promotion.currency} ${promotion.minimumPurchase} required`,
        discountAmount: 0,
        appliedPromotions: [],
      };
    }

    // Calculate discount
    let discountAmount = 0;

    switch (promotion.type) {
      case 'percentage':
        discountAmount = applicableSubtotal * (parseFloat(promotion.value) / 100);
        break;

      case 'fixed':
        discountAmount = parseFloat(promotion.value);
        break;

      case 'free_shipping':
        discountAmount = 0; // Handled separately in shipping calculation
        break;

      case 'buy_x_get_y':
        // TODO: Implement buy X get Y logic
        discountAmount = 0;
        break;
    }

    // Apply maximum discount limit
    if (promotion.maximumDiscount && discountAmount > parseFloat(promotion.maximumDiscount)) {
      discountAmount = parseFloat(promotion.maximumDiscount);
    }

    return {
      eligible: true,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      appliedPromotions: [
        {
          promotionId: promotion.id,
          code: promotion.code || '',
          type: promotion.type as PromotionType,
          discountAmount,
        },
      ],
    };
  }

  /**
   * Filter cart items based on promotion rules
   */
  private filterApplicableItems(
    promotion: typeof promotions.$inferSelect,
    cartItems: CartItem[]
  ): CartItem[] {
    let items = cartItems;

    // Filter by applicable products
    if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
      items = items.filter(item =>
        (promotion.applicableProducts as string[]).includes(item.variantId)
      );
    }

    // Filter by applicable categories
    if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
      items = items.filter(item =>
        item.categoryId && (promotion.applicableCategories as string[]).includes(item.categoryId)
      );
    }

    // Exclude specific products
    if (promotion.excludedProducts && promotion.excludedProducts.length > 0) {
      items = items.filter(item =>
        !(promotion.excludedProducts as string[]).includes(item.variantId)
      );
    }

    return items;
  }

  /**
   * Calculate automatic promotions (no code required)
   */
  async calculateAutomaticPromotions(
    cartItems: CartItem[],
    userId?: string,
    sessionId?: string
  ): Promise<PromotionEligibility> {
    const now = new Date();

    // Find active automatic promotions (no code)
    const automaticPromotions = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          eq(promotions.code, sql`NULL`),
          gte(promotions.endDate, now),
          lte(promotions.startDate, now)
        )
      )
      .orderBy(promotions.priority);

    let totalDiscount = 0;
    const appliedPromotions: PromotionEligibility['appliedPromotions'] = [];

    for (const promotion of automaticPromotions) {
      const eligibility = await this.checkPromotionEligibility(
        promotion,
        cartItems,
        userId,
        sessionId
      );

      if (eligibility.eligible) {
        totalDiscount += eligibility.discountAmount;
        appliedPromotions.push(...eligibility.appliedPromotions);

        // If not stackable, stop after first promotion
        if (!promotion.stackable) {
          break;
        }
      }
    }

    return {
      eligible: appliedPromotions.length > 0,
      discountAmount: totalDiscount,
      appliedPromotions,
    };
  }

  /**
   * Record promotion usage
   */
  async recordPromotionUsage(
    promotionId: string,
    orderId: string,
    discountAmount: number,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    await db.insert(promotionUsage).values({
      promotionId,
      orderId,
      userId,
      sessionId,
      discountAmount: discountAmount.toFixed(2),
    });
  }

  /**
   * Get all active promotions
   */
  async getActivePromotions(): Promise<(typeof promotions.$inferSelect)[]> {
    const now = new Date();

    return await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          gte(promotions.endDate, now),
          lte(promotions.startDate, now)
        )
      )
      .orderBy(promotions.priority);
  }

  /**
   * Create a new promotion
   */
  async createPromotion( {
    code?: string;
    name: string;
    description?: string;
    type: PromotionType;
    value: number;
    currency?: string;
    minimumPurchase?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    startDate: Date;
    endDate: Date;
    applicableProducts?: string[];
    applicableCategories?: string[];
    excludedProducts?: string[];
    stackable?: boolean;
    priority?: number;
  }) {
    const [promotion] = await db
      .insert(promotions)
      .values({
        ...data,
        value: data.value.toString(),
        minimumPurchase: data.minimumPurchase?.toString(),
        maximumDiscount: data.maximumDiscount?.toString(),
      })
      .returning();

    return promotion;
  }

  /**
   * Update product price with history tracking
   */
  async updateProductPrice(
    variantId: string,
    newPrice: number,
    reason: string,
    changedBy?: string
  ): Promise<void> {
    // Get current price
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (!variant) {
      throw new Error('Variant not found');
    }

    const oldPrice = parseFloat(variant.price);

    // Record price history
    await db.insert(priceHistory).values({
      variantId,
      oldPrice: oldPrice.toString(),
      newPrice: newPrice.toString(),
      currency: variant.currency,
      reason,
      changedBy,
    });

    // Update price
    await db
      .update(productVariants)
      .set({
        price: newPrice.toString(),
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId));
  }

  /**
   * Get price history for a variant
   */
  async getPriceHistory(variantId: string) {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.variantId, variantId))
      .orderBy(priceHistory.createdAt);
  }
}

export const promotionsService = new PromotionsService();
