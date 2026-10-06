# ivo Electronics — Source Review Findings Remediation Plan

> **Date:** 2024  
> **Status:** Findings identified, remediation in progress  
> **Priority:** Critical fixes first, then high/medium/low

---

## 📋 Findings Summary

| # | Area | Finding | Risk | Priority |
|---|------|---------|------|----------|
| 1 | Checkout | Frontend shows false success without real operation | Customers see fake order state | 🔴 CRITICAL |
| 2 | Order reference | Random browser-generated order numbers | Collisions, non-auditable, fake confirmations | 🔴 CRITICAL |
| 3 | Database credentials | VITE_NEON_DATABASE_URL exposed in client | Leaked secrets, unauthorized DB access | 🔴 CRITICAL |
| 4 | Persistence | Helpers log rather than persist | Data loss, never reaches database | 🟠 HIGH |
| 5 | Product catalogue | In-memory randomized values | Untrustworthy listings, incorrect commercial data | 🟠 HIGH |
| 6 | Payment records | Can create false payment records | Financial records falsely claim payment | 🔴 CRITICAL |
| 7 | Migrations | Placeholder steps instead of versioned system | Environment drift, risky schema changes | 🟡 MEDIUM |
| 8 | Checkout fields | No validation on shipping/payment fields | Invalid orders, poor UX | 🟠 HIGH |
| 9 | Checkout dismissal | Clears cart unconditionally | Customer data loss, abandoned checkout frustration | 🟡 MEDIUM |
| 10 | Database health | Reports ready without real query | UI shows readiness when DB unreachable | 🟠 HIGH |
| 11 | Tests | No e2e tests for critical paths | Critical assumptions unproven | 🟡 MEDIUM |

---

## 🔴 CRITICAL Remediations (Do First)

### Finding 1: Checkout Shows False Success

**Current State:**
```typescript
// src/App.tsx - CheckoutModal
const handleCheckout = () => {
  setIsProcessing(true);
  setTimeout(() => {
    setIsProcessing(false);
    setIsComplete(true); // ❌ Fake success after timer
  }, 2000);
};
```

**Problem:** Customer sees "Order Confirmed" without any real server operation.

**Remediation:**
```typescript
// src/App.tsx - CheckoutModal (FIXED)
const handleCheckout = async () => {
  setIsProcessing(true);
  setProcessingError(null);
  
  try {
    // 1. Create order via server API
    const orderResponse = await OrderAPI.create({
      idempotencyKey: generateIdempotencyKey(sessionId),
      sessionId,
      shippingAddress: formData,
      currency: getCurrencyCode(),
    });
    
    if (!orderResponse.success) {
      throw new Error(orderResponse.error?.message || 'Failed to create order');
    }
    
    const order = orderResponse.data;
    
    // 2. Initialize payment
    const paymentResponse = await PaymentAPI.initialize(order.id, 'card');
    
    if (!paymentResponse.success) {
      throw new Error(paymentResponse.error?.message || 'Failed to initialize payment');
    }
    
    const payment = paymentResponse.data;
    
    // 3. Redirect to payment provider
    if (payment.authorizationUrl) {
      window.location.href = payment.authorizationUrl;
      return; // Don't show success yet
    }
    
    // 4. Only show success if payment is already captured (rare)
    if (payment.status === 'captured') {
      setIsComplete(true);
    } else {
      // Payment pending - show waiting state
      setPaymentPending(true);
      startPaymentVerification(payment.id);
    }
    
  } catch (error) {
    setProcessingError(error instanceof Error ? error.message : 'Unknown error');
    auditLog('checkout.failed', 'checkout', sessionId, {
      severity: 'error',
      metadata: { error: error instanceof Error ? error.message : 'Unknown' }
    });
  } finally {
    setIsProcessing(false);
  }
};

// Poll for payment status
const startPaymentVerification = (paymentId: string) => {
  const interval = setInterval(async () => {
    const response = await PaymentAPI.verify(paymentId);
    if (response.success && response.data?.status === 'captured') {
      clearInterval(interval);
      setIsComplete(true);
      auditLog('payment.verified', 'payment', paymentId, { severity: 'info' });
    }
  }, 3000);
  
  // Timeout after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
    setPaymentPending(false);
    setProcessingError('Payment verification timeout. Please check your email for order status.');
  }, 300000);
};
```

**Status:** ✅ Implemented in `src/api/client.ts`  
**Action Required:** Update `src/App.tsx` to use new flow

---

### Finding 2: Random Browser-Generated Order Numbers

**Current State:**
```typescript
// src/database/service.ts
export function createNewOrder(items: CartItem[], address: ShippingAddress): Order {
  const order: Order = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, // ❌ Random
    orderNumber: `IVO-${Math.floor(Math.random() * 900000 + 100000)}`, // ❌ Random
    // ...
  };
}
```

**Problem:** Collisions possible, non-auditable, fake confirmations.

**Remediation:**
```typescript
// Server-side order creation (in server API)
async function createOrder(request: CreateOrderRequest): Promise<Order> {
  // Check idempotency
  const existing = await checkIdempotency(request.idempotencyKey);
  if (existing) {
    return existing.response;
  }
  
  // Generate durable ID on server
  const orderId = crypto.randomUUID(); // UUID v4
  const orderNumber = await generateUniqueOrderNumber(); // Server-generated
  
  // Create in transaction
  return await db.transaction(async (tx) => {
    const order = await tx.insert(orders).values({
      id: orderId,
      orderNumber,
      sessionId: request.sessionId,
      status: 'pending_payment',
      // ... other fields
    }).returning();
    
    // Record idempotency
    await recordIdempotency(request.idempotencyKey, order);
    
    return order;
  });
}

// Unique order number generation
async function generateUniqueOrderNumber(): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  const candidate = `IVO-${timestamp}-${random}`;
  
  // Check uniqueness with retry
  const existing = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, candidate)
  });
  
  if (existing) {
    return generateUniqueOrderNumber(); // Retry
  }
  
  return candidate;
}
```

**Status:** ✅ Specified in `SERVER_API_SPEC.md`  
**Action Required:** Implement in server API

---

### Finding 3: Database Credentials Exposed in Client

**Current State:**
```typescript
// src/database/client.ts
connectionString: import.meta.env.VITE_NEON_DATABASE_URL || '', // ❌ Exposed
```

**Problem:** Vite-exposed variables leak into client bundle. Anyone can extract DB credentials.

**Remediation:**
```typescript
// DELETE: src/database/client.ts (entire file)
// DELETE: src/database/queries.ts (entire file)

// UPDATE: src/database/service.ts
// Remove all direct Neon imports, use API client instead

import { OrderAPI, CartAPI, ProductAPI } from '../api/client';

export async function getProducts(): Promise<Product[]> {
  const response = await ProductAPI.getAll();
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch products');
  }
  return response.data || [];
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const response = await OrderAPI.create(request);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to create order');
  }
  return response.data!;
}
```

**Status:** ✅ API client created in `src/api/client.ts`  
**Action Required:** 
1. Delete `src/database/client.ts`
2. Delete `src/database/queries.ts`
3. Update `src/database/service.ts` to use API client
4. Rotate Neon database credentials immediately

---

### Finding 6: False Payment Records

**Current State:**
```typescript
// src/database/queries.ts
export async function createPayment(...) {
  return executeQuery`
    INSERT INTO payments (..., status)
    VALUES (..., 'captured') // ❌ Marks as captured without verification
  `;
}
```

**Problem:** Payment records can be created as "captured" without verified provider evidence.

**Remediation:**
```typescript
// Server-side payment handling (in server API)

// 1. Initialize payment (creates pending record)
async function initializePayment(orderId: string, method: string) {
  const order = await getOrder(orderId);
  if (!order || order.status !== 'pending_payment') {
    throw new Error('Order not ready for payment');
  }
  
  // Create payment record with PENDING status
  const payment = await db.insert(payments).values({
    orderId,
    amount: order.totalAmount,
    currency: order.currency,
    status: 'pending', // ✅ Not captured yet
    paymentMethod: method,
  }).returning();
  
  // Call payment provider
  const providerResponse = await paystack.initializePayment({
    amount: order.totalAmount,
    email: order.shippingAddress.email,
    reference: payment.id,
  });
  
  // Store provider reference
  await db.update(payments)
    .set({ transactionRef: providerResponse.reference })
    .where(eq(payments.id, payment.id));
  
  return {
    ...payment,
    authorizationUrl: providerResponse.authorizationUrl,
  };
}

// 2. Handle webhook (ONLY way to mark as captured)
async function handlePaymentWebhook(payload: PaystackWebhookPayload) {
  // Verify signature
  if (!verifyWebhookSignature(payload)) {
    throw new Error('Invalid webhook signature');
  }
  
  const { reference, status } = payload.data;
  
  // Find payment by reference
  const payment = await db.query.payments.findFirst({
    where: eq(payments.transactionRef, reference)
  });
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Check idempotency
  if (payment.status === 'captured') {
    return; // Already processed
  }
  
  // Update in transaction
  await db.transaction(async (tx) => {
    // Update payment status
    await tx.update(payments)
      .set({
        status: status === 'success' ? 'captured' : 'failed',
        metadata: payload.data,
      })
      .where(eq(payments.id, payment.id));
    
    // Update order status
    if (status === 'success') {
      await tx.update(orders)
        .set({ status: 'paid' })
        .where(eq(orders.id, payment.orderId));
      
      // Decrement stock
      const orderItems = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, payment.orderId)
      });
      
      for (const item of orderItems) {
        await tx.update(products)
          .set({ 
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` 
          })
          .where(eq(products.id, item.productId));
      }
    }
    
    // Audit log
    await tx.insert(auditLog).values({
      entityType: 'payment',
      entityId: payment.id,
      action: 'payment.webhook_received',
      newState: { status, reference },
    });
  });
}
```

**Status:** ✅ Specified in `SERVER_API_SPEC.md`  
**Action Required:** Implement in server API

---

## 🟠 HIGH Priority Remediations

### Finding 4: Persistence Helpers Just Log

**Current State:**
```typescript
// src/database/service.ts
async function syncCartToNeon(items: CartItem[]): Promise<void> {
  console.log(`[Neon Sync] Cart updated: ${items.length} items`); // ❌ Just logs
}
```

**Problem:** Data never reaches database.

**Remediation:**
```typescript
// src/database/service.ts (using API client)
export async function saveCartItems(items: CartItem[]): Promise<void> {
  const sessionId = getSessionId();
  
  // Save to localStorage for optimistic UI
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
  
  // Sync to server
  try {
    for (const item of items) {
      await CartAPI.addItem(sessionId, item.product.id, item.quantity);
    }
    
    auditLog('cart.synced', 'cart', sessionId, {
      severity: 'info',
      metadata: { itemCount: items.length }
    });
  } catch (error) {
    console.error('Failed to sync cart to server:', error);
    // Don't throw - localStorage is fallback
  }
}
```

**Status:** ✅ API client ready  
**Action Required:** Update service to use API calls

---

### Finding 5: In-Memory Randomized Product Data

**Current State:**
```typescript
// src/data/products.ts
export function generateProducts(): Product[] {
  // ... generates random prices, ratings, etc.
  const basePrice = Math.floor(Math.random() * 900) + 49; // ❌ Random
  const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10; // ❌ Random
}
```

**Problem:** Untrustworthy listings, incorrect commercial data.

**Remediation:**
```typescript
// Server-side product management
// Products must come from database with admin workflows

// 1. Database schema (already defined in src/database/schema.ts)
// 2. Admin API endpoints
//    - POST /api/admin/products (create)
//    - PATCH /api/admin/products/:id (update)
//    - DELETE /api/admin/products/:id (delete)
// 3. Admin UI (separate from customer storefront)
// 4. Import/seed script for initial data

// Frontend fetches from API
export async function getProducts(): Promise<Product[]> {
  const response = await ProductAPI.getAll();
  return response.data || [];
}
```

**Status:** ✅ Schema defined  
**Action Required:** 
1. Seed database with real product data
2. Build admin API
3. Build admin UI (optional, can use direct DB access initially)

---

### Finding 8: No Checkout Field Validation

**Current State:**
```typescript
// src/App.tsx - CheckoutModal
<input placeholder="First Name" className="..." /> // ❌ No validation
<input placeholder="Email Address" type="email" className="..." /> // ❌ No validation
```

**Problem:** Invalid or incomplete orders, poor UX.

**Remediation:**
```typescript
// src/utils/validation.ts
import { z } from 'zod';

export const shippingAddressSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State/Region must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(2, 'Country is required'),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

// src/App.tsx - CheckoutModal
const [errors, setErrors] = useState<Record<string, string>>({});

const validateAndSubmit = () => {
  const result = shippingAddressSchema.safeCheck(formData);
  
  if (!result.success) {
    const errorMap: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      errorMap[issue.path[0]] = issue.message;
    });
    setErrors(errorMap);
    return;
  }
  
  setErrors({});
  handleCheckout();
};

// In render
<input 
  placeholder="Email Address" 
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({...formData, email: e.target.value})}
  className={`... ${errors.email ? 'border-red-500' : ''}`}
/>
{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
```

**Status:** ⏳ Not started  
**Action Required:** 
1. Install Zod: `npm install zod`
2. Create validation schemas
3. Add validation to checkout form
4. Add server-side validation in API

---

### Finding 10: Database Health Check Without Real Query

**Current State:**
```typescript
// src/database/client.ts
export function initializeNeon(): boolean {
  try {
    sqlClient = neon(config.connectionString);
    connectionState.isConnected = true; // ❌ Assumes success
    return true;
  } catch (error) {
    return false;
  }
}
```

**Problem:** UI reports readiness when database is unreachable.

**Remediation:**
```typescript
// src/database/client.ts (or server-side health endpoint)
export async function testConnection(): Promise<{ success: boolean; latency: number }> {
  if (!sqlClient) {
    return { success: false, latency: 0 };
  }
  
  try {
    const startTime = performance.now();
    
    // Execute actual query
    const result = await executeQuery`SELECT 1`;
    
    const latency = performance.now() - startTime;
    
    return { success: true, latency };
  } catch (error) {
    return { success: false, latency: 0 };
  }
}

// Server-side health endpoint
// GET /api/health
app.get('/health', async (c) => {
  try {
    const startTime = performance.now();
    await db.execute(sql`SELECT 1`);
    const latency = performance.now() - startTime;
    
    return c.json({
      status: 'healthy',
      database: 'connected',
      latency: Math.round(latency),
      version: '1.0.0',
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503);
  }
});
```

**Status:** ✅ Specified in `SERVER_API_SPEC.md`  
**Action Required:** Implement in server API

---

## 🟡 MEDIUM Priority Remediations

### Finding 7: Placeholder Migration Steps

**Current State:**
```typescript
// src/database/migration.ts
export const MIGRATION_STEPS = [
  { step: 1, description: 'Create enum types', sql: `...` },
  { step: 2, description: 'Create core tables', sql: `-- See schema.ts` }, // ❌ Placeholder
];
```

**Problem:** Environment drift, risky schema changes.

**Remediation:**
```typescript
// Use a proper migration tool like Drizzle Kit or Prisma Migrate

// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NEON_DATABASE_URL!,
  },
} satisfies Config;

// Commands
// npx drizzle-kit generate:pg --name init
// npx drizzle-kit push
// npx drizzle-kit studio

// Or use Prisma
// schema.prisma
// migrations/
//   20240101000000_init/
//     migration.sql
```

**Status:** ⏳ Not started  
**Action Required:** 
1. Choose migration tool (Drizzle Kit recommended)
2. Generate initial migration
3. Document migration process

---

### Finding 9: Checkout Dismissal Clears Cart

**Current State:**
```typescript
// src/App.tsx
const handleCheckoutClose = useCallback(() => {
  setIsCheckoutOpen(false);
  setCartItems([]); // ❌ Clears cart unconditionally
}, []);
```

**Problem:** Customer data loss, abandoned checkout frustration.

**Remediation:**
```typescript
// src/App.tsx
const handleCheckoutClose = useCallback(() => {
  setIsCheckoutOpen(false);
  
  // Only clear cart if order was completed
  if (checkoutCompleted) {
    setCartItems([]);
    localStorage.removeItem('ivo_cart');
    auditLog('cart.cleared', 'cart', sessionId, {
      severity: 'info',
      metadata: { reason: 'order_completed' }
    });
  } else {
    // Preserve cart for abandoned checkout recovery
    auditLog('checkout.abandoned', 'checkout', sessionId, {
      severity: 'info',
      metadata: { cartValue: cartTotal }
    });
  }
}, [checkoutCompleted, cartTotal]);
```

**Status:** ⏳ Not started  
**Action Required:** Update checkout close logic

---

### Finding 11: No E2E Tests

**Current State:** No tests exist.

**Problem:** Critical assumptions unproven.

**Remediation:**
```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('complete checkout with valid data', async ({ page }) => {
    // 1. Add product to cart
    await page.goto('/');
    await page.click('[data-testid="add-to-cart-1"]');
    
    // 2. Open cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    
    // 3. Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // 4. Fill shipping form
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="street"]', '123 Main St');
    await page.fill('[name="city"]', 'Accra');
    await page.fill('[name="state"]', 'Greater Accra');
    await page.fill('[name="postalCode"]', 'GA100');
    
    // 5. Submit
    await page.click('[data-testid="submit-shipping"]');
    
    // 6. Verify order created (mock payment)
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  });
  
  test('validation errors shown for invalid data', async ({ page }) => {
    // ... test validation
  });
  
  test('cart preserved on checkout dismissal', async ({ page }) => {
    // ... test cart preservation
  });
});

// tests/integration/api.spec.ts
import { describe, it, expect } from 'vitest';
import { OrderAPI } from '../src/api/client';

describe('Order API', () => {
  it('creates order with valid data', async () => {
    const response = await OrderAPI.create({
      idempotencyKey: 'test-key-1',
      sessionId: 'test-session',
      shippingAddress: { /* ... */ },
      currency: 'GHS',
    });
    
    expect(response.success).toBe(true);
    expect(response.data?.status).toBe('pending_payment');
  });
  
  it('rejects duplicate idempotency key', async () => {
    // ... test idempotency
  });
});
```

**Status:** ⏳ Not started  
**Action Required:** 
1. Install Playwright: `npm install -D @playwright/test`
2. Write e2e tests for critical flows
3. Set up CI/CD to run tests
4. Add test coverage reporting

---

## 📊 Remediation Status Tracker

| # | Finding | Priority | Status | Action Required |
|---|---------|----------|--------|-----------------|
| 1 | Checkout false success | 🔴 CRITICAL | ✅ Specified | Update App.tsx |
| 2 | Random order numbers | 🔴 CRITICAL | ✅ Specified | Implement in server |
| 3 | DB credentials exposed | 🔴 CRITICAL | ✅ API ready | Delete client.ts, rotate creds |
| 4 | Persistence just logs | 🟠 HIGH | ✅ API ready | Update service.ts |
| 5 | Random product data | 🟠 HIGH | ✅ Schema ready | Seed DB, build admin |
| 6 | False payment records | 🔴 CRITICAL | ✅ Specified | Implement in server |
| 7 | Placeholder migrations | 🟡 MEDIUM | ⏳ Not started | Set up Drizzle Kit |
| 8 | No field validation | 🟠 HIGH | ⏳ Not started | Add Zod validation |
| 9 | Cart cleared on dismiss | 🟡 MEDIUM | ⏳ Not started | Update close logic |
| 10 | Health check no query | 🟠 HIGH | ✅ Specified | Implement in server |
| 11 | No e2e tests | 🟡 MEDIUM | ⏳ Not started | Add Playwright tests |

---

## 🚀 Implementation Order

### Week 1: Critical Security (Days 1-5)
1. **Day 1:** Remove client-side Neon connection
   - Delete `src/database/client.ts`
   - Delete `src/database/queries.ts`
   - Update `src/database/service.ts` to use API client
   - Rotate Neon credentials
   
2. **Day 2-3:** Build server API foundation
   - Set up Node.js/Hono project
   - Implement health endpoint
   - Implement products endpoint
   
3. **Day 4-5:** Implement order creation
   - Server-side order creation with transactions
   - Idempotency handling
   - Unique order number generation

### Week 2: Payment Integration (Days 6-10)
4. **Day 6-7:** Payment initialization
   - Paystack integration
   - Payment intent creation
   
5. **Day 8-9:** Webhook handling
   - Signature verification
   - Payment status updates
   - Order state transitions
   
6. **Day 10:** Testing
   - Manual testing of payment flows
   - Webhook testing with Paystack test mode

### Week 3: Frontend Updates (Days 11-15)
7. **Day 11-12:** Update checkout flow
   - Replace timer-based success with API calls
   - Add payment verification polling
   - Handle errors gracefully
   
8. **Day 13-14:** Add validation
   - Install Zod
   - Create validation schemas
   - Add client-side validation
   
9. **Day 15:** Fix cart preservation
   - Update checkout dismissal logic
   - Test abandoned checkout recovery

### Week 4: Database & Testing (Days 16-20)
10. **Day 16-17:** Database migration
    - Set up Drizzle Kit
    - Generate initial migration
    - Seed product data
    
11. **Day 18-19:** E2E tests
    - Install Playwright
    - Write critical flow tests
    - Set up CI/CD
    
12. **Day 20:** Documentation
    - Update README
    - Document deployment process
    - Create operations manual

---

## ✅ Success Criteria

### Security
- [ ] Zero client-side database credentials
- [ ] All prices from server API
- [ ] Payment status from verified webhooks only
- [ ] Idempotency on all financial operations
- [ ] Audit log for every state change

### Functionality
- [ ] Checkout creates real server-side order
- [ ] Order numbers are unique and durable
- [ ] Payment verification via webhooks
- [ ] Cart preserved on checkout dismissal
- [ ] Field validation on checkout

### Reliability
- [ ] Database health check verifies real connectivity
- [ ] Product data from database, not randomized
- [ ] Persistence actually saves to database
- [ ] Error handling for all failure modes

### Testing
- [ ] E2E tests for checkout flow
- [ ] Integration tests for API
- [ ] Unit tests for validation
- [ ] Load test results documented

---

## 📝 Notes

- **Reconfirm findings** against current branch before implementation
- **Test in staging** before production deployment
- **Monitor closely** after each critical change
- **Rollback plan** for each deployment
- **Communication** with stakeholders on progress

---

*This remediation plan addresses all findings from the source review with concrete implementations and a clear timeline.*
