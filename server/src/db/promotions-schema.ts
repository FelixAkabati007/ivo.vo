import { pgTable, uuid, varchar, text, numeric, integer, boolean, timestamp, jsonb, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { products, productVariants, orders } from './schema';

// ============================================
// PROMOTIONS & DISCOUNTS
// ============================================

export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).unique(), // Discount code (nullable for automatic promotions)
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'percentage', 'fixed', 'free_shipping', 'buy_x_get_y'
  value: numeric('value', { precision: 10, scale: 2 }).notNull(), // Discount value (percentage or fixed amount)
  currency: varchar('currency', { length: 3 }), // For fixed discounts
  minimumPurchase: numeric('minimum_purchase', { precision: 10, scale: 2 }), // Minimum order value
  maximumDiscount: numeric('maximum_discount', { precision: 10, scale: 2 }), // Maximum discount amount
  usageLimit: integer('usage_limit'), // Total usage limit
  usageLimitPerUser: integer('usage_limit_per_user').default(1), // Per-user limit
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  applicableProducts: jsonb('applicable_products').$type<string[]>(), // Product IDs (null = all)
  applicableCategories: jsonb('applicable_categories').$type<string[]>(), // Category IDs (null = all)
  excludedProducts: jsonb('excluded_products').$type<string[]>(), // Product IDs to exclude
  stackable: boolean('stackable').default(false).notNull(), // Can be combined with other promotions
  priority: integer('priority').default(0).notNull(), // Higher priority = applied first
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('promotions_code_idx').on(table.code),
  activeIdx: index('promotions_active_idx').on(table.isActive),
  dateRangeIdx: index('promotions_date_range_idx').on(table.startDate, table.endDate),
}));

export const promotionUsage = pgTable('promotion_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 255 }), // For guest checkouts
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  promotionIdx: index('promotion_usage_promotion_idx').on(table.promotionId),
  orderIdx: index('promotion_usage_order_idx').on(table.orderId),
  userIdx: index('promotion_usage_user_idx').on(table.userId),
  sessionIdx: index('promotion_usage_session_idx').on(table.sessionId),
}));

export const priceHistory = pgTable('price_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  oldPrice: numeric('old_price', { precision: 12, scale: 2 }).notNull(),
  newPrice: numeric('new_price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  reason: varchar('reason', { length: 100 }), // 'manual', 'promotion', 'bulk_update'
  changedBy: uuid('changed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantIdx: index('price_history_variant_idx').on(table.variantId),
  createdAtIdx: index('price_history_created_at_idx').on(table.createdAt),
}));

// Relations
export const promotionsRelations = relations(promotions, ({ many }) => ({
  usage: many(promotionUsage),
}));

export const promotionUsageRelations = relations(promotionUsage, ({ one }) => ({
  promotion: one(promotions, {
    fields: [promotionUsage.promotionId],
    references: [promotions.id],
  }),
  order: one(orders, {
    fields: [promotionUsage.orderId],
    references: [orders.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [priceHistory.variantId],
    references: [productVariants.id],
  }),
}));
