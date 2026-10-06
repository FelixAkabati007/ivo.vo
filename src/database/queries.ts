/**
 * Neon Database Queries for ivo Electronics
 * 
 * All SQL queries used by the application.
 * Uses parameterized queries for security (SQL injection prevention).
 * Includes proper error handling and type safety.
 */

import { executeQuery } from './client';

// ============================================
// PRODUCT QUERIES
// ============================================

export async function getAllProducts() {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE is_active = TRUE
    ORDER BY created_at DESC
  `;
}

export async function getProductsByCategory(category: string) {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE category = ${category} AND is_active = TRUE
    ORDER BY rating DESC
  `;
}

export async function searchProducts(query: string) {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE is_active = TRUE
      AND (name ILIKE ${'%' + query + '%'} 
           OR description ILIKE ${'%' + query + '%'}
           OR category ILIKE ${'%' + query + '%'})
    ORDER BY rating DESC
    LIMIT 50
  `;
}

export async function getProductById(id: number) {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE id = ${id} AND is_active = TRUE
  `;
}

export async function getProductsSortedByPriceLow() {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE is_active = TRUE
    ORDER BY price ASC
  `;
}

export async function getProductsSortedByPriceHigh() {
  return executeQuery`
    SELECT id, name, slug, category, description, price, original_price,
           currency, stock_quantity, rating, reviews_count, image_url,
           features, badge, is_active, created_at, updated_at
    FROM products
    WHERE is_active = TRUE
    ORDER BY price DESC
  `;
}

// ============================================
// CART QUERIES
// ============================================

export async function getCartItems(sessionId: string) {
  return executeQuery`
    SELECT ci.id, ci.product_id, ci.quantity, ci.added_at,
           p.name, p.price, p.image_url, p.category, p.stock_quantity
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ${sessionId}
    ORDER BY ci.added_at DESC
  `;
}

export async function addToCart(sessionId: string, productId: number, quantity: number) {
  return executeQuery`
    INSERT INTO cart_items (session_id, product_id, quantity)
    VALUES (${sessionId}, ${productId}, ${quantity})
    ON CONFLICT (session_id, product_id) 
    DO UPDATE SET quantity = LEAST(cart_items.quantity + ${quantity}, 10),
                  updated_at = NOW()
    RETURNING *
  `;
}

export async function updateCartQuantity(sessionId: string, productId: number, quantity: number) {
  if (quantity <= 0) {
    return executeQuery`
      DELETE FROM cart_items 
      WHERE session_id = ${sessionId} AND product_id = ${productId}
      RETURNING *
    `;
  }
  return executeQuery`
    UPDATE cart_items 
    SET quantity = LEAST(${quantity}, 10), updated_at = NOW()
    WHERE session_id = ${sessionId} AND product_id = ${productId}
    RETURNING *
  `;
}

export async function removeFromCart(sessionId: string, productId: number) {
  return executeQuery`
    DELETE FROM cart_items 
    WHERE session_id = ${sessionId} AND product_id = ${productId}
    RETURNING *
  `;
}

export async function clearCart(sessionId: string) {
  return executeQuery`
    DELETE FROM cart_items WHERE session_id = ${sessionId}
  `;
}

// ============================================
// ORDER QUERIES
// ============================================

export async function createOrder(
  orderNumber: string,
  sessionId: string,
  subtotal: number,
  shippingCost: number,
  totalAmount: number,
  shippingAddress: object
) {
  return executeQuery`
    INSERT INTO orders (order_number, session_id, subtotal, shipping_cost, total_amount, shipping_address, status)
    VALUES (${orderNumber}, ${sessionId}, ${subtotal}, ${shippingCost}, ${totalAmount}, ${JSON.stringify(shippingAddress)}::jsonb, 'confirmed')
    RETURNING *
  `;
}

export async function addOrderItem(
  orderId: string,
  productId: number,
  productName: string,
  quantity: number,
  unitPrice: number,
  totalPrice: number
) {
  return executeQuery`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (${orderId}::uuid, ${productId}, ${productName}, ${quantity}, ${unitPrice}, ${totalPrice})
    RETURNING *
  `;
}

export async function getOrderById(orderId: string) {
  return executeQuery`
    SELECT o.*, 
           json_agg(json_build_object(
             'product_id', oi.product_id,
             'product_name', oi.product_name,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price
           )) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ${orderId}::uuid
    GROUP BY o.id
  `;
}

export async function getOrdersBySession(sessionId: string) {
  return executeQuery`
    SELECT * FROM orders
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
  `;
}

// ============================================
// PAYMENT QUERIES
// ============================================

export async function createPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  transactionRef: string
) {
  return executeQuery`
    INSERT INTO payments (order_id, amount, payment_method, transaction_ref, status)
    VALUES (${orderId}::uuid, ${amount}, ${paymentMethod}, ${transactionRef}, 'captured')
    RETURNING *
  `;
}

// ============================================
// AUDIT LOG QUERIES
// ============================================

export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  oldValues: object | null,
  newValues: object | null
) {
  return executeQuery`
    INSERT INTO audit_log (entity_type, entity_id, action, old_values, new_values)
    VALUES (${entityType}, ${entityId}, ${action}, 
            ${oldValues ? JSON.stringify(oldValues) : null}::jsonb,
            ${newValues ? JSON.stringify(newValues) : null}::jsonb)
  `;
}

// ============================================
// DATABASE HEALTH QUERIES
// ============================================

export async function getDatabaseStats() {
  return executeQuery`
    SELECT 
      (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
      (SELECT COUNT(DISTINCT category) FROM products WHERE is_active = TRUE) as total_categories,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
      (SELECT COUNT(*) FROM users) as total_users
  `;
}


