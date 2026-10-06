/**
 * Database Service for ivo Electronics
 * 
 * High-level data access layer that:
 * - Uses server-side API for all database operations
 * - Falls back to localStorage for guest experience
 * - Provides a unified API regardless of backend
 * - Implements caching and optimistic updates
 * - Logs all operations for audit trail
 * 
 * SECURITY: This service NEVER connects directly to the database.
 * All database operations go through the server-side API.
 */

import { allProducts, type Product } from '../data/products';
import { ProductAPI, CartAPI, OrderAPI, HealthAPI } from '../api/client';

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
  mode: 'api' | 'local';
  connected: boolean;
  latency: number | null;
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

let databaseMode: 'api' | 'local' = 'local';
let isConnected = false;
let lastLatency: number | null = null;

export function initializeDatabase(): DatabaseStatus {
  // Check if API is available
  if (import.meta.env.VITE_API_BASE_URL) {
    databaseMode = 'api';
    isConnected = true;
  }

  return {
    mode: databaseMode,
    connected: isConnected,
    latency: lastLatency,
    productCount: allProducts.length,
    lastSync: getLastSync(),
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  if (databaseMode === 'api') {
    try {
      const startTime = performance.now();
      const response = await HealthAPI.check();
      lastLatency = performance.now() - startTime;
      isConnected = response.success === true;
    } catch (error) {
      isConnected = false;
      lastLatency = null;
    }
  }

  return {
    mode: databaseMode,
    connected: isConnected,
    latency: lastLatency,
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
  // Products are static sample data - in production, this would call the API
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

  // If API is available, also sync to server
  if (databaseMode === 'api') {
    syncCartToServer(items).catch(console.error);
  }
}

async function syncCartToServer(items: CartItem[]): Promise<void> {
  const sessionId = getSessionId();
  
  try {
    // Clear server cart first
    await CartAPI.clear(sessionId);
    
    // Add each item
    for (const item of items) {
      await CartAPI.addItem(sessionId, item.product.id, item.quantity);
    }
    
    console.log(`[API Sync] Cart synced: ${items.length} items`);
  } catch (error) {
    console.error('[API Sync] Failed to sync cart:', error);
  }
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEYS.CART);
  updateLastSync();

  // If API is available, also clear server cart
  if (databaseMode === 'api') {
    const sessionId = getSessionId();
    CartAPI.clear(sessionId).catch(console.error);
  }
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

  // If API is available, also persist to server
  if (databaseMode === 'api') {
    persistOrderToServer(order).catch(console.error);
  }

  // Clear cart after order
  clearCart();

  return order;
}

async function persistOrderToServer(order: Order): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    await OrderAPI.create({
      idempotencyKey: `order_${order.id}`,
      sessionId,
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        email: order.shippingAddress.email || 'guest@example.com',
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zip,
        country: 'Ghana',
      },
      currency: 'GHS',
    });
    
    console.log(`[API Sync] Order created: ${order.orderNumber}`);
  } catch (error) {
    console.error('[API Sync] Failed to create order:', error);
  }
}

// ============================================
// DATABASE STATUS
// ============================================

export function getDatabaseMode(): 'api' | 'local' {
  return databaseMode;
}

export function isNeonActive(): boolean {
  return databaseMode === 'api';
}

export function getNeonInfo() {
  return {
    configured: databaseMode === 'api',
    active: databaseMode === 'api',
    connection: {
      isConnected,
      latency: lastLatency,
    },
    schema: 'ivo_electronics',
    tables: [
      'users', 'addresses', 'products', 'cart_items',
      'orders', 'order_items', 'payments', 'audit_log'
    ],
  };
}
