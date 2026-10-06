# ivo Electronics — Server API Specification

> **Status:** Specification for the server-side API that must be implemented.  
> **Purpose:** This API is the TRUSTED layer between the browser and the database.  
> **Critical:** The browser NEVER has direct database access.

---

## 1. Architecture Overview

```
Browser (Untrusted)
    ↓ HTTPS + Auth
Server API (Trusted)
    ↓
Neon PostgreSQL (Source of Truth)
    ↓
Payment Provider (Paystack/Stripe)
    ↓
n8n Workflows (Async Operations)
```

---

## 2. Endpoints

### 2.1 Products API

#### GET /api/products
Get all active products with server-authoritative prices.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nova Pro X1",
      "slug": "nova-pro-x1",
      "category": "Smartphones",
      "price": 2500.00,
      "originalPrice": 3000.00,
      "currency": "GHS",
      "stockQuantity": 50,
      "rating": 4.5,
      "reviewsCount": 120,
      "imageUrl": "https://...",
      "features": ["6.7\" AMOLED", "200MP Camera"],
      "badge": "Hot",
      "isActive": true
    }
  ]
}
```

**Security:** Prices come from database, not client.

---

#### GET /api/products/:id
Get a single product by ID.

---

#### GET /api/products/search?q={query}
Search products with full-text search.

---

### 2.2 Cart API

#### GET /api/cart/:sessionId
Get current cart with server-calculated totals.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 2500.00,
        "currency": "GHS"
      }
    ],
    "subtotal": 5000.00,
    "currency": "GHS"
  }
}
```

**Security:** Server validates stock and recalculates prices.

---

#### POST /api/cart/:sessionId/items
Add item to cart.

**Request:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Server Logic:**
1. Validate product exists and is active
2. Check stock availability
3. Get price from database (NOT from client)
4. Add to cart
5. Recalculate totals
6. Return updated cart

**Idempotency:** Use `Idempotency-Key` header to prevent duplicates.

---

#### PATCH /api/cart/:sessionId/items/:productId
Update cart item quantity.

**Request:**
```json
{
  "quantity": 3
}
```

**Server Logic:**
1. Validate product exists
2. Check stock availability for new quantity
3. Update quantity
4. Recalculate totals

---

#### DELETE /api/cart/:sessionId/items/:productId
Remove item from cart.

---

#### DELETE /api/cart/:sessionId
Clear entire cart.

---

### 2.3 Orders API

#### POST /api/orders
Create a new order.

**Request:**
```json
{
  "idempotencyKey": "order_session_abc123_1234567890_xyz",
  "sessionId": "session_abc123",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+233201234567",
    "street": "123 Main St",
    "city": "Accra",
    "state": "Greater Accra",
    "postalCode": "GA100",
    "country": "Ghana"
  },
  "currency": "GHS"
}
```

**Server Logic (CRITICAL):**
```sql
BEGIN TRANSACTION;

1. Validate idempotency key (check if order already exists)
2. Get cart items from database
3. For each item:
   - Get product from database
   - Validate stock availability
   - Lock stock (SELECT FOR UPDATE)
   - Calculate price from database
4. Calculate subtotal, tax, shipping
5. Create order record with status 'pending_payment'
6. Create order_items records
7. Clear cart
8. Commit transaction
9. Dispatch audit log event
10. Return order

COMMIT;
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "orderNumber": "IVO-123456",
    "status": "pending_payment",
    "items": [...],
    "subtotal": 5000.00,
    "shippingCost": 0.00,
    "taxAmount": 0.00,
    "totalAmount": 5000.00,
    "currency": "GHS",
    "shippingAddress": {...},
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Security:**
- Prices calculated server-side
- Stock validated and locked
- Idempotency key prevents duplicates
- Transaction ensures atomicity

---

#### GET /api/orders/:orderId
Get order by ID.

**Security:** Only return order if sessionId matches or user is authenticated.

---

#### GET /api/orders?sessionId={sessionId}
Get all orders for a session.

---

### 2.4 Payments API

#### POST /api/payments/initialize
Initialize payment for an order.

**Request:**
```json
{
  "orderId": "uuid-here",
  "paymentMethod": "card"
}
```

**Server Logic:**
1. Validate order exists and is in 'pending_payment' state
2. Create payment record in database with status 'pending'
3. Call payment provider API to create payment intent
4. Store payment provider reference
5. Return authorization URL to client

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "amount": 5000.00,
    "currency": "GHS",
    "status": "pending",
    "paymentMethod": "card",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "paystack_ref_123"
  }
}
```

**Security:**
- Payment amount comes from order (not client)
- Payment provider called server-side
- Client receives authorization URL to redirect user

---

#### POST /api/payments/webhook
Handle payment provider webhook.

**Request (from Paystack):**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "paystack_ref_123",
    "amount": 500000, // in kobo/pesewas
    "status": "success",
    "metadata": {...}
  }
}
```

**Server Logic (CRITICAL):**
```
1. Verify webhook signature (HMAC)
2. Parse payload
3. Find payment by reference
4. Check if already processed (idempotency)
5. BEGIN TRANSACTION
6. Update payment status to 'captured'
7. Update order status to 'paid'
8. Decrement stock quantities
9. Create audit log entry
10. COMMIT TRANSACTION
11. Dispatch n8n webhook (order confirmation email)
12. Return 200 OK
```

**Security:**
- Webhook signature verification (CRITICAL)
- Idempotent processing (handle duplicate webhooks)
- Transactional updates
- No client involvement

---

#### GET /api/payments/:paymentId/verify
Verify payment status.

**Server Logic:**
1. Get payment from database
2. Optionally call payment provider to verify
3. Return current status

**Security:** Status comes from database, updated only by verified webhooks.

---

### 2.5 Internal API (for n8n)

#### GET /api/internal/orders/:orderId
Get order details (requires internal API key).

**Headers:**
```
X-Internal-Key: {secret}
```

**Security:** Only accessible with internal API key, not exposed to browser.

---

#### GET /api/internal/products/low-stock?threshold=10
Get products with low stock.

---

#### GET /api/internal/carts/abandoned?hours=24
Get abandoned carts.

---

#### POST /api/internal/payments/:paymentId/reconcile
Reconcile payment status.

---

### 2.6 Health & Monitoring

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

---

#### POST /api/audit
Receive audit log entry from client.

**Request:**
```json
{
  "id": "audit_123",
  "timestamp": "2024-01-01T12:00:00Z",
  "action": "order.created",
  "severity": "info",
  "entityType": "order",
  "entityId": "order-uuid",
  "actor": {...},
  "previousState": null,
  "newState": {...},
  "correlationId": "corr_123",
  "requestId": "req_123"
}
```

---

#### POST /api/metrics
Receive metrics from client.

**Request:**
```json
{
  "metrics": [
    {
      "name": "api.request.duration",
      "value": 150,
      "tags": { "endpoint": "/products" },
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

## 3. Authentication & Authorization

### 3.1 Session-Based Auth (Guest Users)
- Session ID stored in localStorage
- Passed in `X-Session-Id` header
- Used for cart and order operations

### 3.2 JWT Auth (Registered Users)
- JWT token in `Authorization: Bearer {token}` header
- Refresh token for long-lived sessions
- User ID extracted from token

### 3.3 Internal API Key (n8n Workflows)
- Static API key in `X-Internal-Key` header
- Only for internal endpoints
- Not exposed to browser

---

## 4. Error Handling

### 4.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Product 'Nova Pro X1' has insufficient stock",
    "details": {
      "productId": 1,
      "requested": 5,
      "available": 2
    }
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### 4.2 Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `INSUFFICIENT_STOCK` - Not enough stock
- `PAYMENT_FAILED` - Payment processing failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `IDEMPOTENCY_CONFLICT` - Duplicate request detected
- `INTERNAL_ERROR` - Server error

---

## 5. Rate Limiting

- **Public endpoints:** 100 requests/minute per IP
- **Cart operations:** 30 requests/minute per session
- **Order creation:** 5 requests/minute per session
- **Payment initialization:** 3 requests/minute per session

---

## 6. Implementation Stack

### 6.1 Recommended Stack
- **Runtime:** Node.js 20+
- **Framework:** Hono (lightweight, TypeScript-native) or Express
- **Database:** Neon PostgreSQL (via @neondatabase/serverless)
- **ORM:** Drizzle ORM (type-safe, lightweight)
- **Validation:** Zod (runtime type checking)
- **Auth:** jose (JWT handling)
- **Payments:** Paystack SDK (Ghana-focused)
- **Logging:** Pino (structured JSON)
- **Testing:** Vitest + Supertest

### 6.2 Project Structure
```
server/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── products.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   ├── payments.ts
│   │   │   └── internal.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── rateLimit.ts
│   │       └── validation.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── queries/
│   │   └── migrations/
│   ├── services/
│   │   ├── productService.ts
│   │   ├── cartService.ts
│   │   ├── orderService.ts
│   │   └── paymentService.ts
│   ├── utils/
│   │   ├── idempotency.ts
│   │   ├── audit.ts
│   │   └── currency.ts
│   └── index.ts
├── tests/
└── package.json
```

---

## 7. Deployment

### 7.1 Environment Variables
```bash
# Database
NEON_DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
INTERNAL_API_KEY=...

# Payments
PAYSTACK_PUBLIC_KEY=...
PAYSTACK_SECRET_KEY=...
PAYSTACK_WEBHOOK_SECRET=...

# n8n
N8N_WEBHOOK_URL=...

# Monitoring
SENTRY_DSN=...
```

### 7.2 Hosting Options
- **Vercel** (serverless functions)
- **Railway** (container-based)
- **Fly.io** (container-based)
- **AWS Lambda** (serverless)

---

## 8. Security Checklist

- [ ] All prices calculated server-side
- [ ] Stock validated and locked in transactions
- [ ] Payment webhooks signature verified
- [ ] Idempotency keys on all financial operations
- [ ] Rate limiting on all endpoints
- [ ] Input validation with Zod
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CORS configured correctly
- [ ] HTTPS only
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Audit logging for all state changes
- [ ] Error messages don't leak sensitive info
- [ ] Database credentials in environment variables
- [ ] Regular dependency updates

---

*This specification must be implemented before the ivo platform can process real transactions.*
