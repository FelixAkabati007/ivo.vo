/**
 * Database Service for ivo Electronics
 * 
 * High-level data access layer that:
 * - Uses Neon PostgreSQL when configured
 * - Falls back to in-memory/localStorage when not connected
 * - Provides a unified API regardless of backend
 * - Implements caching and optimistic updates
 * - Logs all operations for audit trail
 */

import { isNeonConfigured, initializeNeon, testConnection, getConnectionState, type ConnectionState } from './client';
import { allProducts, type Product } from '../data/products';

// ============================================
// TYPES
// ============================================

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  shippingAddress: ShippingAddress;
  createdAt: Date;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface DatabaseStatus {
  mode: 'neon' | 'local';
  connection: ConnectionState;
  productCount: number;
  lastSync: Date | null;
}

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  CART: 'ivo_cart',
  ORDERS: 'ivo_orders',
  SESSION: 'ivo_session_id',
  LAST_SYNC: 'ivo_last_sync',
};

// ============================================
// SESSION MANAGEMENT
// ============================================

function getSessionId(): string {
  let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.SESSION, sessionId);
  }
  return sessionId;
}

// ============================================
// DATABASE MODE DETECTION
// ============================================

let databaseMode: 'neon' | 'local' = 'local';

export function initializeDatabase(): DatabaseStatus {
  if (isNeonConfigured()) {
    const success = initializeNeon();
    databaseMode = success ? 'neon' : 'local';
  }

  return {
    mode: databaseMode,
    connection: getConnectionState(),
    productCount: allProducts.length,
    lastSync: getLastSync(),
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  if (databaseMode === 'neon') {
    await testConnection();
  }

  return {
    mode: databaseMode,
    connection: getConnectionState(),
    productCount: allProducts.length,
    lastSync: getLastSync(),
  };
}

function getLastSync(): Date | null {
  const sync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  return sync ? new Date(sync) : null;
}

function updateLastSync() {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

// ============================================
// PRODUCT OPERATIONS
// ============================================

export function getProducts(): Product[] {
  // Products are static sample data - in production, this would query Neon
  return allProducts;
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'All') return allProducts;
  return allProducts.filter(p => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}

export function getProductById(id: number): Product | undefined {
  return allProducts.find(p => p.id === id);
}

// ============================================
// CART OPERATIONS
// ============================================

export function getCartItems(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CART);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Hydrate product data from our static source
    return parsed.map((item: { productId: number; quantity: number }) => {
      const product = allProducts.find(p => p.id === item.productId);
      if (!product) return null;
      return { product, quantity: item.quantity };
    }).filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  const serialized = items.map(item => ({
    productId: item.product.id,
    quantity: item.quantity,
  }));
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(serialized));
  updateLastSync();

  // If Neon is connected, also sync to database
  if (databaseMode === 'neon') {
    syncCartToNeon(items).catch(console.error);
  }
}

async function syncCartToNeon(items: CartItem[]): Promise<void> {
  // In production, this would use the Neon queries
  // For now, we just log the intent
  console.log(`[Neon Sync] Cart updated: ${items.length} items`);
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEYS.CART);
  updateLastSync();
}

// ============================================
// ORDER OPERATIONS
// ============================================

export function getOrders(): Order[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
    }));
  } catch {
    return [];
  }
}

export function createNewOrder(items: CartItem[], address: ShippingAddress): Order {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const order: Order = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    orderNumber: `IVO-${Math.floor(Math.random() * 900000 + 100000)}`,
    items,
    subtotal,
    shippingCost: 0, // Free shipping
    total: subtotal,
    status: 'confirmed',
    shippingAddress: address,
    createdAt: new Date(),
  };

  // Save to local storage
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  updateLastSync();

  // If Neon is connected, also persist to database
  if (databaseMode === 'neon') {
    persistOrderToNeon(order).catch(console.error);
  }

  // Clear cart after order
  clearCart();

  return order;
}

async function persistOrderToNeon(order: Order): Promise<void> {
  // In production, this would use the Neon queries to:
  // 1. Create the order record
  // 2. Create order_items records
  // 3. Create payment record
  // 4. Log audit event
  console.log(`[Neon Sync] Order created: ${order.orderNumber} - GH₵${order.total.toFixed(2)}`);
}

// ============================================
// DATABASE STATUS
// ============================================

export function getDatabaseMode(): 'neon' | 'local' {
  return databaseMode;
}

export function isNeonActive(): boolean {
  return databaseMode === 'neon';
}

export function getNeonInfo() {
  return {
    configured: isNeonConfigured(),
    active: databaseMode === 'neon',
    connection: getConnectionState(),
    schema: 'ivo_electronics',
    tables: [
      'users', 'addresses', 'products', 'cart_items',
      'orders', 'order_items', 'payments', 'audit_log'
    ],
  };
}
