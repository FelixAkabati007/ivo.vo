/**
 * Secure API Client for ivo Electronics
 * 
 * CRITICAL SECURITY NOTE:
 * This client communicates with a SERVER-SIDE API, NOT directly with the database.
 * The browser NEVER has direct database access. All financial operations are
 * validated server-side.
 * 
 * Architecture:
 * Browser → API Client → Server API → Neon PostgreSQL
 * 
 * The server API is responsible for:
 * - Price validation (browser cannot change prices)
 * - Stock checking (browser cannot bypass stock limits)
 * - Order creation (transactional, server-authoritative)
 * - Payment webhook handling (verified server-side)
 */

import { getCurrencyCode } from '../config/currency';

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    latency?: number;
  };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  stockQuantity: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  features: string[];
  badge: string | null;
  isActive: boolean;
}

export interface CartItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  idempotencyKey: string;  // CRITICAL: Prevents duplicate orders
  sessionId: string;
  shippingAddress: ShippingAddress;
  currency: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed';
  paymentMethod: string;
  authorizationUrl?: string;
  reference: string;
}

// ============================================
// API CONFIGURATION
// ============================================

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  retries: 3,
  apiVersion: 'v1',
};

// ============================================
// HTTP CLIENT
// ============================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const startTime = performance.now();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Currency': getCurrencyCode(),
    'X-Request-Id': generateRequestId(),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = performance.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
        meta: {
          requestId: headers['X-Request-Id'],
          timestamp: new Date().toISOString(),
          latency,
        },
      };
    }

    return {
      ...data,
      meta: {
        ...data.meta,
        requestId: headers['X-Request-Id'],
        timestamp: new Date().toISOString(),
        latency,
      },
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: `Request timed out after ${API_CONFIG.timeout}ms`,
        },
        meta: {
          requestId: headers['X-Request-Id'],
          timestamp: new Date().toISOString(),
          latency,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error',
      },
      meta: {
        requestId: headers['X-Request-Id'],
        timestamp: new Date().toISOString(),
        latency,
      },
    };
  }
}

// ============================================
// PRODUCT API
// ============================================

export const ProductAPI = {
  /**
   * Get all active products
   * Note: Prices come from the server, not the client
   */
  async getAll(): Promise<ApiResponse<Product[]>> {
    return request<Product[]>('/products');
  },

  /**
   * Get products by category
   */
  async getByCategory(category: string): Promise<ApiResponse<Product[]>> {
    return request<Product[]>(`/products?category=${encodeURIComponent(category)}`);
  },

  /**
   * Search products
   */
  async search(query: string): Promise<ApiResponse<Product[]>> {
    return request<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get a single product by ID
   */
  async getById(id: number): Promise<ApiResponse<Product>> {
    return request<Product>(`/products/${id}`);
  },
};

// ============================================
// CART API
// ============================================

export const CartAPI = {
  /**
   * Get current cart
   */
  async get(sessionId: string): Promise<ApiResponse<Cart>> {
    return request<Cart>(`/cart/${sessionId}`);
  },

  /**
   * Add item to cart
   * CRITICAL: Server validates price and stock
   */
  async addItem(
    sessionId: string,
    productId: number,
    quantity: number
  ): Promise<ApiResponse<Cart>> {
    return request<Cart>(`/cart/${sessionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  /**
   * Update cart item quantity
   * CRITICAL: Server validates stock availability
   */
  async updateItem(
    sessionId: string,
    productId: number,
    quantity: number
  ): Promise<ApiResponse<Cart>> {
    return request<Cart>(`/cart/${sessionId}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Remove item from cart
   */
  async removeItem(sessionId: string, productId: number): Promise<ApiResponse<Cart>> {
    return request<Cart>(`/cart/${sessionId}/items/${productId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Clear entire cart
   */
  async clear(sessionId: string): Promise<ApiResponse<void>> {
    return request<void>(`/cart/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// ORDER API
// ============================================

export const OrderAPI = {
  /**
   * Create a new order
   * 
   * CRITICAL SECURITY NOTES:
   * 1. The idempotencyKey prevents duplicate orders
   * 2. The server recalculates prices from the database
   * 3. The server validates stock availability
   * 4. The order is created in a database transaction
   * 5. The order starts in 'pending_payment' state
   * 6. Payment status is updated ONLY via verified webhooks
   */
  async create(orderRequest: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderRequest),
      headers: {
        'Idempotency-Key': orderRequest.idempotencyKey,
      },
    });
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string): Promise<ApiResponse<Order>> {
    return request<Order>(`/orders/${orderId}`);
  },

  /**
   * Get orders for a session
   */
  async getBySession(sessionId: string): Promise<ApiResponse<Order[]>> {
    return request<Order[]>(`/orders?sessionId=${encodeURIComponent(sessionId)}`);
  },
};

// ============================================
// PAYMENT API
// ============================================

export const PaymentAPI = {
  /**
   * Initialize payment for an order
   * 
   * CRITICAL: This creates a payment intent on the server.
   * The actual payment happens via the payment provider.
   * The server will receive a webhook callback when payment completes.
   */
  async initialize(orderId: string, paymentMethod: string): Promise<ApiResponse<PaymentIntent>> {
    return request<PaymentIntent>(`/payments/initialize`, {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod }),
    });
  },

  /**
   * Verify payment status
   * 
   * CRITICAL: This checks the server-side payment status,
   * which is updated ONLY via verified webhooks from the payment provider.
   * The client cannot fake a successful payment.
   */
  async verify(paymentId: string): Promise<ApiResponse<PaymentIntent>> {
    return request<PaymentIntent>(`/payments/${paymentId}/verify`);
  },
};

// ============================================
// HEALTH API
// ============================================

export const HealthAPI = {
  /**
   * Check API health
   */
  async check(): Promise<ApiResponse<{ status: string; database: string; version: string }>> {
    return request('/health');
  },
};

// ============================================
// UTILITIES
// ============================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an idempotency key for order creation
 * This ensures that if the same order is submitted multiple times
 * (e.g., due to network issues), only one order is created.
 */
export function generateIdempotencyKey(sessionId: string): string {
  return `order_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
