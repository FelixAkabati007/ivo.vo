import { pgTable, uuid, varchar, text, numeric, integer, boolean, timestamp, jsonb, pgEnum, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// ENUMS - State Machines
// ============================================

export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);
export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'pending_payment',
  'paid',
  'processing',
  'fulfilled',
  'payment_failed',
  'cancelled',
  'partially_fulfilled',
  'refunded',
  'partially_refunded',
  'requires_review',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'pending',
  'succeeded',
  'failed',
  'cancelled',
  'refund_pending',
  'partially_refunded',
  'refunded',
  'disputed',
]);
export const inventoryMovementReasonEnum = pgEnum('inventory_movement_reason', [
  'sale',
  'return',
  'adjustment',
  'damage',
  'transfer',
  'initial_stock',
  'correction',
]);
export const reservationStatusEnum = pgEnum('reservation_status', ['active', 'confirmed', 'released', 'expired']);
export const webhookProcessingStateEnum = pgEnum('webhook_processing_state', ['received', 'processing', 'completed', 'failed']);
export const outboxEventStateEnum = pgEnum('outbox_event_state', ['pending', 'processing', 'delivered', 'failed']);

// ============================================
// IDENTITY AND ACCESS
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  status: userStatusEnum('status').default('active').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  statusIdx: index('users_status_idx').on(table.status),
}));

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userRoleIdx: uniqueIndex('user_roles_user_role_idx').on(table.userId, table.roleId),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  rolePermissionIdx: uniqueIndex('role_permissions_role_permission_idx').on(table.roleId, table.permissionId),
}));

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'shipping' or 'billing'
  label: varchar('label', { length: 50 }).default('Home'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  company: varchar('company', { length: 200 }),
  street: varchar('street', { length: 255 }).notNull(),
  street2: varchar('street2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('addresses_user_idx').on(table.userId),
}));

export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  actorEmail: varchar('actor_email', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 100 }).notNull(),
  targetId: varchar('target_id', { length: 255 }).notNull(),
  reason: text('reason'),
  metadata: jsonb('metadata'),
  correlationId: varchar('correlation_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actorIdx: index('admin_audit_log_actor_idx').on(table.actorId),
  targetIdx: index('admin_audit_log_target_idx').on(table.targetType, table.targetId),
  createdAtIdx: index('admin_audit_log_created_at_idx').on(table.createdAt),
}));

// ============================================
// CATALOGUE
// ============================================

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references(() => categories.id),
  isVisible: boolean('is_visible').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
  parentIdx: index('categories_parent_idx').on(table.parentId),
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, active, archived
  brand: varchar('brand', { length: 100 }),
  categoryId: uuid('category_id').references(() => categories.id),
  seoTitle: varchar('seo_title', { length: 200 }),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
  categoryIdx: index('products_category_idx').on(table.categoryId),
  statusIdx: index('products_status_idx').on(table.status),
}));

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  options: jsonb('options').$type<Record<string, string>>(), // e.g., {color: "red", size: "L"}
  weight: numeric('weight', { precision: 10, scale: 2 }), // in grams
  length: numeric('length', { precision: 10, scale: 2 }), // in cm
  width: numeric('width', { precision: 10, scale: 2 }),
  height: numeric('height', { precision: 10, scale: 2 }),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('GHS').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  skuIdx: uniqueIndex('product_variants_sku_idx').on(table.sku),
  productIdx: index('product_variants_product_idx').on(table.productId),
}));

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdx: index('product_images_product_idx').on(table.productId),
}));

export const productReviews = pgTable('product_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 200 }),
  content: text('content'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  moderationStatus: varchar('moderation_status', { length: 20 }).default('pending').notNull(), // pending, approved, rejected
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdx: index('product_reviews_product_idx').on(table.productId),
  userIdx: index('product_reviews_user_idx').on(table.userId),
}));

// ============================================
// INVENTORY
// ============================================

export const inventoryLocations = pgTable('inventory_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  onHand: integer('on_hand').default(0).notNull(),
  reserved: integer('reserved').default(0).notNull(),
  available: integer('available').generatedAlwaysAs(sql`on_hand - reserved`).notNull(),
  version: integer('version').default(1).notNull(), // Optimistic locking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantLocationIdx: uniqueIndex('inventory_variant_location_idx').on(table.variantId, table.locationId),
  variantIdx: index('inventory_variant_idx').on(table.variantId),
}));

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id),
  reason: inventoryMovementReasonEnum('reason').notNull(),
  quantity: integer('quantity').notNull(), // Positive for increase, negative for decrease
  beforeQuantity: integer('before_quantity').notNull(),
  afterQuantity: integer('after_quantity').notNull(),
  reference: varchar('reference', { length: 255 }), // Order ID, return ID, etc.
  actorId: uuid('actor_id').references(() => users.id),
  actorType: varchar('actor_type', { length: 50 }), // 'user', 'system', 'admin'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  inventoryIdx: index('inventory_movements_inventory_idx').on(table.inventoryId),
  createdAtIdx: index('inventory_movements_created_at_idx').on(table.createdAt),
}));

export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id),
  quantity: integer('quantity').notNull(),
  status: reservationStatusEnum('status').default('active').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('stock_reservations_order_idx').on(table.orderId),
  variantIdx: index('stock_reservations_variant_idx').on(table.variantId),
  statusIdx: index('stock_reservations_status_idx').on(table.status),
  expiresIdx: index('stock_reservations_expires_idx').on(table.expiresAt),
}));

// ============================================
// CUSTOMER ACTIVITY
// ============================================

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  currency: varchar('currency', { length: 3 }).default('GHS').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdx: uniqueIndex('carts_session_idx').on(table.sessionId),
  userIdx: index('carts_user_idx').on(table.userId),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartIdx: index('cart_items_cart_idx').on(table.cartId),
  cartVariantIdx: uniqueIndex('cart_items_cart_variant_idx').on(table.cartId, table.variantId),
}));

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVariantIdx: uniqueIndex('wishlists_user_variant_idx').on(table.userId, table.variantId),
}));

// ============================================
// ORDERS
// ============================================

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 50 }),
  status: orderStatusEnum('status').default('draft').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('created').notNull(),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }).default('unfulfilled'),
  currency: varchar('currency', { length: 3 }).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  shippingAmount: numeric('shipping_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  shippingAddressSnapshot: jsonb('shipping_address_snapshot').notNull(),
  billingAddressSnapshot: jsonb('billing_address_snapshot'),
  notes: text('notes'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
  userIdx: index('orders_user_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  idempotencyIdx: uniqueIndex('orders_idempotency_idx').on(table.idempotencyKey),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  sku: varchar('sku', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }).notNull(),
  options: jsonb('options').$type<Record<string, string>>(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  unitTax: numeric('unit_tax', { precision: 12, scale: 2 }).default('0').notNull(),
  unitDiscount: numeric('unit_discount', { precision: 12, scale: 2 }).default('0').notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  variantIdx: index('order_items_variant_idx').on(table.variantId),
}));

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  oldStatus: orderStatusEnum('old_status'),
  newStatus: orderStatusEnum('new_status').notNull(),
  actorId: uuid('actor_id').references(() => users.id),
  actorType: varchar('actor_type', { length: 50 }).notNull(), // 'user', 'system', 'admin'
  reason: text('reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_status_history_order_idx').on(table.orderId),
  createdAtIdx: index('order_status_history_created_at_idx').on(table.createdAt),
}));

// ============================================
// PAYMENTS
// ============================================

export const paymentAttempts = pgTable('payment_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'paystack', 'stripe', etc.
  providerReference: varchar('provider_reference', { length: 255 }),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: paymentStatusEnum('status').default('created').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('payment_attempts_order_idx').on(table.orderId),
  providerRefIdx: index('payment_attempts_provider_ref_idx').on(table.providerReference),
  idempotencyIdx: uniqueIndex('payment_attempts_idempotency_idx').on(table.idempotencyKey),
}));

export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentAttemptId: uuid('payment_attempt_id').notNull().references(() => paymentAttempts.id),
  providerEventId: varchar('provider_event_id', { length: 255 }).notNull().unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  processingStatus: varchar('processing_status', { length: 50 }).default('pending').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  providerEventIdx: uniqueIndex('payment_events_provider_event_idx').on(table.providerEventId),
  paymentIdx: index('payment_events_payment_idx').on(table.paymentAttemptId),
}));

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  paymentAttemptId: uuid('payment_attempt_id').notNull().references(() => paymentAttempts.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  reason: text('reason').notNull(),
  providerReference: varchar('provider_reference', { length: 255 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  actorId: uuid('actor_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('refunds_order_idx').on(table.orderId),
  paymentIdx: index('refunds_payment_idx').on(table.paymentAttemptId),
}));

// ============================================
// RELIABILITY
// ============================================

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull(),
  externalEventId: varchar('external_event_id', { length: 255 }).notNull().unique(),
  signatureValid: boolean('signature_valid').notNull(),
  payload: jsonb('payload').notNull(),
  processingState: webhookProcessingStateEnum('processing_state').default('received').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  lastError: text('last_error'),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  externalEventIdx: uniqueIndex('webhook_events_external_event_idx').on(table.externalEventId),
  providerIdx: index('webhook_events_provider_idx').on(table.provider),
  processingStateIdx: index('webhook_events_processing_state_idx').on(table.processingState),
}));

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  aggregateId: varchar('aggregate_id', { length: 255 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  state: outboxEventStateEnum('state').default('pending').notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
}, (table) => ({
  stateIdx: index('outbox_events_state_idx').on(table.state),
  nextRetryIdx: index('outbox_events_next_retry_idx').on(table.nextRetryAt),
  aggregateIdx: index('outbox_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
}));

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: varchar('actor_id', { length: 255 }).notNull(),
  scope: varchar('scope', { length: 100 }).notNull(),
  key: varchar('key', { length: 255 }).notNull(),
  requestHash: varchar('request_hash', { length: 255 }).notNull(),
  responseReference: varchar('response_reference', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actorScopeKeyIdx: uniqueIndex('idempotency_keys_actor_scope_key_idx').on(table.actorId, table.scope, table.key),
  expiresIdx: index('idempotency_keys_expires_idx').on(table.expiresAt),
}));

export const reconciliationRuns = pgTable('reconciliation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull(),
  timeRangeStart: timestamp('time_range_start', { withTimezone: true }).notNull(),
  timeRangeEnd: timestamp('time_range_end', { withTimezone: true }).notNull(),
  totalCount: integer('total_count').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  discrepancyCount: integer('discrepancy_count').default(0).notNull(),
  discrepancyAmount: numeric('discrepancy_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  resolutionState: varchar('resolution_state', { length: 50 }).default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  providerIdx: index('reconciliation_runs_provider_idx').on(table.provider),
  createdAtIdx: index('reconciliation_runs_created_at_idx').on(table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  carts: many(carts),
  wishlists: many(wishlists),
  userRoles: many(userRoles),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(productReviews),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventory: many(inventory),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  stockReservations: many(stockReservations),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
  location: one(inventoryLocations, {
    fields: [inventory.locationId],
    references: [inventoryLocations.id],
  }),
  movements: many(inventoryMovements),
  stockReservations: many(stockReservations),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  paymentAttempts: many(paymentAttempts),
  refunds: many(refunds),
  stockReservations: many(stockReservations),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const paymentAttemptsRelations = relations(paymentAttempts, ({ one, many }) => ({
  order: one(orders, {
    fields: [paymentAttempts.orderId],
    references: [orders.id],
  }),
  events: many(paymentEvents),
  refunds: many(refunds),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));
