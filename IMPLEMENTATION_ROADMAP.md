# ivo Electronics - Implementation Roadmap

> **Purpose:** Phased implementation plan with clear deliverables and exit gates  
> **Timeline:** Estimated 12-16 weeks to production  
> **Last Updated:** 2024-01-15

---

## Table of Contents

1. [Phase 0: Confirm the Baseline](#phase-0-confirm-the-baseline)
2. [Phase 1: Secure the Foundation](#phase-1-secure-the-foundation)
3. [Phase 2: Make Catalogue and Inventory Real](#phase-2-make-catalogue-and-inventory-real)
4. [Phase 3: Build the Durable Commerce Core](#phase-3-build-the-durable-commerce-core)
5. [Phase 4: Integrate Real Payments](#phase-4-integrate-real-payments)
6. [Phase 5: Enterprise-Grade Customer/Admin UX](#phase-5-enterprise-grade-customeradmin-ux)
7. [Phase 6: n8n Operations and Bounded AI](#phase-6-n8n-operations-and-bounded-ai)
8. [Phase 7: Production Hardening and Launch](#phase-7-production-hardening-and-launch)

---

## Phase 0: Confirm the Baseline

**Duration:** 1 week  
**Goal:** Document current state and identify all risks

### Deliverables

- [ ] Confirm current branch/commit and deployment source
- [ ] Map every route, API call, database access path
- [ ] Inventory all environment variables
- [ ] Document checkout state machine
- [ ] Inventory dependencies and versions
- [ ] Document auth assumptions
- [ ] Review existing schema
- [ ] Verify provider accounts (Paystack, Neon, etc.)
- [ ] Capture reproducible bugs with screenshots
- [ ] Create risk register
- [ ] Define acceptance criteria
- [ ] Identify exposed secrets and rotate if needed

### Exit Gate

✅ Current architecture and failure paths are documented  
✅ No implementation assumptions remain unlabelled  
✅ Risk register created with mitigation plans

### Key Activities

1. **Code Audit**
   - Review all API endpoints
   - Map database queries
   - Document authentication flow
   - Identify hardcoded values

2. **Infrastructure Review**
   - Check deployment configuration
   - Review environment variables
   - Verify secrets management
   - Document monitoring setup

3. **Security Assessment**
   - Run secret scanning
   - Check for exposed credentials
   - Review access controls
   - Identify vulnerabilities

4. **Documentation**
   - Create architecture diagrams
   - Document data flows
   - Map user journeys
   - Create risk register

---

## Phase 1: Secure the Foundation

**Duration:** 2 weeks  
**Goal:** Remove all security vulnerabilities and establish secure foundation

### Deliverables

- [ ] Remove browser access to privileged Neon credentials
- [ ] Create trusted server-side database access
- [ ] Validate environment variables at startup
- [ ] Implement versioned migrations
- [ ] Add CI migration checks
- [ ] Add real database health/readiness query
- [ ] Add input validation on all endpoints
- [ ] Implement typed errors
- [ ] Add request IDs to all requests
- [ ] Implement server-side authorization
- [ ] Add secret scanning to CI
- [ ] Add dependency scanning to CI
- [ ] Separate dev, preview, and production environments

### Exit Gate

✅ No privileged database secret is shipped to the browser  
✅ Server-side integration test proves safe database access  
✅ All environment variables validated at startup  
✅ CI pipeline includes secret and dependency scanning

### Implementation Steps

#### Week 1: Remove Client-Side Database Access

1. **Audit current database usage**
   ```bash
   # Find all database imports in client code
   grep -r "from.*database" src/ --include="*.ts" --include="*.tsx"
   ```

2. **Create server API layer**
   - Implement `/api/v1/products` endpoint
   - Implement `/api/v1/cart` endpoint
   - Implement `/api/v1/orders` endpoint
   - Add authentication middleware

3. **Update frontend to use API**
   - Replace direct DB calls with API calls
   - Add error handling
   - Add loading states
   - Test all user flows

4. **Remove client-side database code**
   - Delete `src/database/client.ts`
   - Delete `src/database/queries.ts`
   - Update imports
   - Verify build succeeds

#### Week 2: Security Hardening

5. **Environment validation**
   ```typescript
   // server/src/config/validation.ts
   export function validateEnv() {
     const required = [
       'NEON_DATABASE_URL',
       'JWT_SECRET',
       'PAYSTACK_SECRET_KEY',
     ];
     
     for (const key of required) {
       if (!process.env[key]) {
         throw new Error(`Missing required env var: ${key}`);
       }
     }
   }
   ```

6. **Database migrations**
   ```bash
   # Setup Drizzle Kit
   npm install -D drizzle-kit
   
   # Generate initial migration
   npm run db:generate
   
   # Add migration check to CI
   ```

7. **Input validation**
   ```typescript
   // Validate all inputs with Zod
   import { z } from 'zod';
   
   const createOrderSchema = z.object({
     items: z.array(z.object({
       productId: z.string().uuid(),
       quantity: z.number().int().positive(),
     })),
     shippingAddress: z.object({
       // ... validation rules
     }),
   });
   ```

8. **Request IDs**
   ```typescript
   // Add request ID middleware
   app.use('*', async (c, next) => {
     const requestId = c.req.header('x-request-id') || crypto.randomUUID();
     c.set('requestId', requestId);
     c.header('x-request-id', requestId);
     await next();
   });
   ```

9. **CI security scanning**
   ```yaml
   # .github/workflows/security.yml
   - name: Secret scanning
     run: npm run secret-scan
   
   - name: Dependency audit
     run: npm audit --audit-level=high
   ```

---

## Phase 2: Make Catalogue and Inventory Real

**Duration:** 2 weeks  
**Goal:** Replace randomized data with persistent, audited catalogue

### Deliverables

- [ ] Persist categories to database
- [ ] Persist products to database
- [ ] Persist product variants to database
- [ ] Persist product images to database
- [ ] Persist prices with history
- [ ] Persist stock levels
- [ ] Replace randomized catalogue data
- [ ] Implement controlled admin CRUD
- [ ] Add audit history for all edits
- [ ] Add inventory movements
- [ ] Implement concurrency-safe stock operations
- [ ] Add deterministic seed fixtures
- [ ] Implement caching for public catalogue

### Exit Gate

✅ Public product data comes from authoritative database  
✅ Availability reflects real stock levels  
✅ All edits are audited and validated  
✅ No randomized data in production

### Implementation Steps

#### Week 1: Database Schema and Admin CRUD

1. **Finalize schema**
   ```sql
   -- Categories table
   CREATE TABLE categories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug VARCHAR(100) UNIQUE NOT NULL,
     name VARCHAR(200) NOT NULL,
     description TEXT,
     parent_id UUID REFERENCES categories(id),
     is_visible BOOLEAN DEFAULT true,
     sort_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Products table
   CREATE TABLE products (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     status VARCHAR(20) DEFAULT 'draft',
     brand VARCHAR(100),
     category_id UUID REFERENCES categories(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Product variants table
   CREATE TABLE product_variants (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id UUID REFERENCES products(id) ON DELETE CASCADE,
     sku VARCHAR(100) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     price DECIMAL(12, 2) NOT NULL,
     currency VARCHAR(3) DEFAULT 'GHS',
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Implement admin API**
   ```typescript
   // POST /api/v1/admin/products
   app.post('/api/v1/admin/products', 
     authMiddleware,
     requirePermission('catalog.products.create'),
     async (c) => {
       const data = await c.req.json();
       const validated = createProductSchema.parse(data);
       
       const product = await db.insert(products)
         .values(validated)
         .returning();
       
       // Log audit
       await logAudit('product.created', product.id, c.get('userId'));
       
       return c.json({ success: true, data: product });
     }
   );
   ```

3. **Add audit logging**
   ```typescript
   async function logAudit(
     action: string,
     entityId: string,
     userId: string,
     changes?: any
   ) {
     await db.insert(adminAuditLog).values({
       action,
       entityType: 'product',
       entityId,
       actorId: userId,
       newState: changes,
       createdAt: new Date(),
     });
   }
   ```

#### Week 2: Inventory and Stock Management

4. **Implement inventory tracking**
   ```sql
   CREATE TABLE inventory (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     variant_id UUID REFERENCES product_variants(id),
     location_id UUID REFERENCES inventory_locations(id),
     on_hand INTEGER DEFAULT 0,
     reserved INTEGER DEFAULT 0,
     version INTEGER DEFAULT 1,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Concurrency-safe stock operations**
   ```typescript
   async function reserveStock(variantId: string, quantity: number) {
     return await db.transaction(async (tx) => {
       // Lock the row
       const [inventory] = await tx
         .select()
         .from(inventory)
         .where(eq(inventory.variantId, variantId))
         .forUpdate();
       
       const available = inventory.on_hand - inventory.reserved;
       
       if (available < quantity) {
         throw new Error('Insufficient stock');
       }
       
       // Update with optimistic locking
       await tx.update(inventory)
         .set({
           reserved: inventory.reserved + quantity,
           version: inventory.version + 1,
         })
         .where(
           and(
             eq(inventory.id, inventory.id),
             eq(inventory.version, inventory.version)
           )
         );
       
       // Log movement
       await tx.insert(inventoryMovements).values({
         inventoryId: inventory.id,
         reason: 'sale',
         quantity: -quantity,
         beforeQuantity: available,
         afterQuantity: available - quantity,
       });
     });
   }
   ```

6. **Seed fixtures**
   ```typescript
   // server/scripts/seed.ts
   const categories = [
     { slug: 'smartphones', name: 'Smartphones' },
     { slug: 'laptops', name: 'Laptops' },
     { slug: 'audio', name: 'Audio' },
   ];
   
   await db.insert(categoriesTable).values(categories);
   ```

---

## Phase 3: Build the Durable Commerce Core

**Duration:** 2 weeks  
**Goal:** Implement reliable order and payment processing

### Deliverables

- [ ] Persistent cart model
- [ ] Explicit guest/account policy
- [ ] Server-side checkout quote
- [ ] Server-side price recomputation
- [ ] Durable orders
- [ ] Item snapshots in orders
- [ ] Stock reservation model
- [ ] Order state machine
- [ ] Payment state machine
- [ ] Idempotency for create-order
- [ ] Idempotency for payment-attempt
- [ ] Customer order status/history
- [ ] Ownership checks on orders
- [ ] Admin order operations
- [ ] Permission controls

### Exit Gate

✅ Orders survive refresh/redeploy  
✅ Concurrent final-unit purchase tests do not oversell  
✅ False-success paths are removed  
✅ All order state changes are audited

### Implementation Steps

#### Week 1: Cart and Checkout

1. **Persistent cart**
   ```sql
   CREATE TABLE carts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id VARCHAR(255) UNIQUE NOT NULL,
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE cart_items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
     variant_id UUID REFERENCES product_variants(id),
     quantity INTEGER NOT NULL,
     added_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Server-side price computation**
   ```typescript
   async function computeCheckoutQuote(cartId: string) {
     const cart = await getCartWithItems(cartId);
     
     let subtotal = 0;
     const items = [];
     
     for (const item of cart.items) {
       // Fetch current price from DB
       const variant = await db.query.productVariants.findFirst({
         where: eq(productVariants.id, item.variantId),
       });
       
       const lineTotal = parseFloat(variant.price) * item.quantity;
       subtotal += lineTotal;
       
       items.push({
         variantId: variant.id,
         sku: variant.sku,
         productName: variant.name,
         quantity: item.quantity,
         unitPrice: variant.price,
         lineTotal: lineTotal.toFixed(2),
       });
     }
     
     return {
       items,
       subtotal: subtotal.toFixed(2),
       currency: 'GHS',
     };
   }
   ```

3. **Idempotent order creation**
   ```typescript
   async function createOrder(idempotencyKey: string, data: any) {
     // Check if already processed
     const existing = await db.query.orders.findFirst({
       where: eq(orders.idempotencyKey, idempotencyKey),
     });
     
     if (existing) {
       return existing; // Return existing order
     }
     
     return await db.transaction(async (tx) => {
       // Create order
       const [order] = await tx.insert(orders)
         .values({
           ...data,
           idempotencyKey,
           status: 'pending_payment',
         })
         .returning();
       
       // Reserve stock
       for (const item of data.items) {
         await reserveStock(item.variantId, item.quantity);
       }
       
       return order;
     });
   }
   ```

#### Week 2: State Machines and Order Management

4. **Order state machine**
   ```typescript
   const ORDER_TRANSITIONS = {
     draft: ['pending_payment', 'cancelled'],
     pending_payment: ['paid', 'cancelled', 'payment_failed'],
     paid: ['processing', 'refunded'],
     processing: ['fulfilled', 'refunded'],
     fulfilled: ['refunded'],
     cancelled: [],
     payment_failed: ['pending_payment', 'cancelled'],
     refunded: [],
   };
   
   async function transitionOrder(orderId: string, newStatus: string) {
     const order = await getOrder(orderId);
     
     if (!ORDER_TRANSITIONS[order.status].includes(newStatus)) {
       throw new Error(`Invalid transition: ${order.status} → ${newStatus}`);
     }
     
     await db.update(orders)
       .set({ status: newStatus, updatedAt: new Date() })
       .where(eq(orders.id, orderId));
     
     // Log state change
     await logOrderStateChange(orderId, order.status, newStatus);
   }
   ```

5. **Customer order access with ownership**
   ```typescript
   app.get('/api/v1/me/orders/:orderId', authMiddleware, async (c) => {
     const userId = c.get('userId');
     const orderId = c.req.param('orderId');
     
     const order = await db.query.orders.findFirst({
       where: and(
         eq(orders.id, orderId),
         eq(orders.userId, userId)
       ),
     });
     
     if (!order) {
       return c.json({ error: 'Order not found' }, 404);
     }
     
     return c.json({ success: true, data: order });
   });
   ```

---

## Phase 4: Integrate Real Payments

**Duration:** 2 weeks  
**Goal:** Integrate Paystack with proper verification and reconciliation

### Deliverables

- [ ] Select Paystack as provider
- [ ] Verify Ghana merchant eligibility
- [ ] Test sandbox capabilities
- [ ] Implement server-side payment initiation
- [ ] Implement signed webhook endpoint
- [ ] Implement duplicate-event handling
- [ ] Implement amount/currency/reference verification
- [ ] Implement payment reconciliation job
- [ ] Implement discrepancy workflow
- [ ] Implement refund state machine
- [ ] Add permission controls for refunds
- [ ] Implement customer-safe payment states
- [ ] Create provider sandbox E2E tests
- [ ] Create finance runbook

### Exit Gate

✅ No order is marked paid without provider-verified evidence  
✅ Duplicate/out-of-order events are safe  
✅ Reconciliation can resolve uncertainty  
✅ Refunds require proper authorization

### Implementation Steps

#### Week 1: Payment Integration

1. **Payment initiation**
   ```typescript
   async function initiatePayment(orderId: string) {
     const order = await getOrder(orderId);
     
     // Create payment attempt
     const [payment] = await db.insert(paymentAttempts)
       .values({
         orderId,
         provider: 'paystack',
         amount: order.grandTotal,
         currency: order.currency,
         status: 'pending',
         idempotencyKey: generateIdempotencyKey(),
       })
       .returning();
     
     // Initialize with Paystack
     const response = await fetch('https://api.paystack.co/transaction/initialize', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         email: order.customerEmail,
         amount: Math.round(parseFloat(order.grandTotal) * 100), // Convert to kobo
         reference: payment.id,
         metadata: { order_id: orderId },
       }),
     });
     
     const data = await response.json();
     
     // Update payment with provider reference
     await db.update(paymentAttempts)
       .set({ providerReference: data.data.reference })
       .where(eq(paymentAttempts.id, payment.id));
     
     return {
       authorizationUrl: data.data.authorization_url,
       reference: data.data.reference,
     };
   }
   ```

2. **Webhook handler with signature verification**
   ```typescript
   import { createHmac } from 'crypto';
   
   app.post('/api/v1/webhooks/paystack', async (c) => {
     const signature = c.req.header('x-paystack-signature');
     const body = await c.req.text();
     
     // Verify signature
     const hash = createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
       .update(body)
       .digest('hex');
     
     if (hash !== signature) {
       return c.json({ error: 'Invalid signature' }, 401);
     }
     
     const event = JSON.parse(body);
     
     // Check for duplicate
     const existing = await db.query.webhookEvents.findFirst({
       where: eq(webhookEvents.externalEventId, event.data.id),
     });
     
     if (existing) {
       metricsRegistry.increment(METRICS.DUPLICATE_WEBHOOKS);
       return c.json({ success: true, message: 'Already processed' });
     }
     
     // Process webhook
     await processWebhook(event);
     
     // Record webhook
     await db.insert(webhookEvents).values({
       provider: 'paystack',
       externalEventId: event.data.id,
       eventType: event.event,
       signatureValid: true,
       payload: event,
       state: 'processed',
     });
     
     return c.json({ success: true });
   });
   ```

3. **Webhook processing**
   ```typescript
   async function processWebhook(event: any) {
     const { reference, status, amount } = event.data;
     
     // Find payment attempt
     const payment = await db.query.paymentAttempts.findFirst({
       where: eq(paymentAttempts.providerReference, reference),
     });
     
     if (!payment) {
       throw new Error('Payment not found');
     }
     
     // Verify amount
     const expectedAmount = Math.round(parseFloat(payment.amount) * 100);
     if (amount !== expectedAmount) {
       throw new Error('Amount mismatch');
     }
     
     // Update payment status
     if (status === 'success') {
       await db.update(paymentAttempts)
         .set({ status: 'succeeded' })
         .where(eq(paymentAttempts.id, payment.id));
       
       // Update order status
       await transitionOrder(payment.orderId, 'paid');
     } else if (status === 'failed') {
       await db.update(paymentAttempts)
         .set({ status: 'failed' })
         .where(eq(paymentAttempts.id, payment.id));
       
       await transitionOrder(payment.orderId, 'payment_failed');
     }
   }
   ```

#### Week 2: Reconciliation and Refunds

4. **Reconciliation job**
   ```typescript
   async function reconcilePayments() {
     const pendingPayments = await db.query.paymentAttempts.findMany({
       where: eq(paymentAttempts.status, 'pending'),
     });
     
     for (const payment of pendingPayments) {
       // Verify with Paystack
       const response = await fetch(
         `https://api.paystack.co/transaction/verify/${payment.providerReference}`,
         {
           headers: {
             'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
           },
         }
       );
       
       const data = await response.json();
       
       if (data.data.status === 'success') {
         // Update local state
         await processWebhook({
           data: {
             reference: payment.providerReference,
             status: 'success',
             amount: data.data.amount,
           },
         });
       }
     }
   }
   
   // Run every hour
   cron.schedule('0 * * * *', reconcilePayments);
   ```

5. **Refund state machine**
   ```typescript
   const REFUND_TRANSITIONS = {
     pending: ['processing', 'failed'],
     processing: ['succeeded', 'failed'],
     succeeded: [],
     failed: ['pending'],
   };
   
   async function issueRefund(orderId: string, amount: number, reason: string) {
     const order = await getOrder(orderId);
     
     // Check permissions
     // (handled by middleware)
     
     // Create refund record
     const [refund] = await db.insert(refunds)
       .values({
         orderId,
         amount: amount.toFixed(2),
         currency: order.currency,
         reason,
         status: 'pending',
       })
       .returning();
     
     // Process with Paystack
     const response = await fetch('https://api.paystack.co/refund', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         transaction: order.paymentReference,
         amount: Math.round(amount * 100),
       }),
     });
     
     const data = await response.json();
     
     if (data.status) {
       await db.update(refunds)
         .set({ status: 'succeeded', providerReference: data.data.reference })
         .where(eq(refunds.id, refund.id));
       
       await transitionOrder(orderId, 'refunded');
     } else {
       await db.update(refunds)
         .set({ status: 'failed' })
         .where(eq(refunds.id, refund.id));
     }
     
     return refund;
   }
   ```

---

## Phase 5: Enterprise-Grade Customer/Admin UX

**Duration:** 2 weeks  
**Goal:** Polish UI/UX for production readiness

### Deliverables

- [ ] Shared design tokens
- [ ] Reusable components
- [ ] Responsive product pages
- [ ] Responsive cart
- [ ] Responsive checkout
- [ ] Responsive order pages
- [ ] Responsive admin pages
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Retry mechanisms
- [ ] Pending states
- [ ] Accessible forms
- [ ] Keyboard navigation
- [ ] Focus handling
- [ ] Screen reader announcements
- [ ] Optimized images
- [ ] Route splitting
- [ ] Performance budgets
- [ ] Mobile testing
- [ ] Low-bandwidth testing

### Exit Gate

✅ Critical customer journeys pass accessibility checks  
✅ Responsive design works on all target devices  
✅ Performance budgets met (LCP < 2.5s, FID < 100ms, CLS < 0.1)  
✅ All error states handled gracefully

### Implementation Steps

(Detailed in separate UX implementation document)

---

## Phase 6: n8n Operations and Bounded AI

**Duration:** 2 weeks  
**Goal:** Implement automation and AI with proper guardrails

### Deliverables

- [ ] Transactional outbox
- [ ] Event contracts
- [ ] Idempotent order notification workflow
- [ ] Payment reconciliation workflow
- [ ] Low-stock alert workflow
- [ ] Abandoned-cart workflow
- [ ] Consent/frequency controls
- [ ] Support triage workflow
- [ ] Daily operations summary
- [ ] AI tool permissions
- [ ] AI data minimization
- [ ] AI evaluation set
- [ ] AI fallback behavior
- [ ] Workflow monitoring
- [ ] Dead-letter path
- [ ] Replay procedure
- [ ] Runbooks

### Exit Gate

✅ Disabling n8n/AI does not corrupt orders, payments, or inventory  
✅ Retries do not duplicate side effects  
✅ All workflows are idempotent  
✅ AI cannot modify financial truth

### Implementation Steps

(Detailed in separate n8n and AI implementation documents)

---

## Phase 7: Production Hardening and Launch

**Duration:** 1-2 weeks  
**Goal:** Prepare for production launch

### Deliverables

- [ ] Full CI gates
- [ ] Staging release
- [ ] Load tests
- [ ] Abuse tests
- [ ] Failure-injection tests
- [ ] Backup/restore rehearsal
- [ ] Security review
- [ ] Privacy review
- [ ] Legal/accounting checks
- [ ] Monitoring dashboards
- [ ] Alerts configured
- [ ] On-call ownership
- [ ] Runbooks completed
- [ ] Data migration plan
- [ ] Rollback plan
- [ ] Production smoke tests
- [ ] Controlled rollout
- [ ] Post-launch review (24h, 7d, 30d)

### Exit Gate

✅ Signed release checklist with evidence  
✅ Named owners for all critical paths  
✅ Rollback path tested  
✅ Unresolved-risk register documented  
✅ Post-launch monitoring in place

### Implementation Steps

#### Week 1: Testing and Review

1. **Load testing**
   ```bash
   # Use k6 or similar
   k6 run load-tests/checkout.js
   
   # Target: 100 concurrent users, 95% < 2s response time
   ```

2. **Security review**
   - Penetration testing
   - Code review for security issues
   - Dependency audit
   - Secret scanning

3. **Backup/restore rehearsal**
   ```bash
   # Test backup
   neonctl backups create --project-id {project_id}
   
   # Test restore
   neonctl branches restore --backup-id {backup_id}
   ```

#### Week 2: Launch

4. **Monitoring setup**
   - Grafana dashboards
   - Alert rules
   - Log aggregation
   - Error tracking (Sentry)

5. **Controlled rollout**
   ```bash
   # Start with 10% traffic
   kubectl set env deployment/ivo-api ROLLOUT_PERCENTAGE=10
   
   # Monitor for 24h
   # Then 25%, 50%, 100%
   ```

6. **Post-launch reviews**
   - 24-hour review
   - 7-day review
   - 30-day review

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Baseline | 1 week | None |
| Phase 1: Security | 2 weeks | Phase 0 |
| Phase 2: Catalogue | 2 weeks | Phase 1 |
| Phase 3: Commerce | 2 weeks | Phase 2 |
| Phase 4: Payments | 2 weeks | Phase 3 |
| Phase 5: UX | 2 weeks | Phase 3 (parallel with Phase 4) |
| Phase 6: Automation | 2 weeks | Phase 4 |
| Phase 7: Launch | 1-2 weeks | All previous |

**Total: 12-16 weeks**

---

## Risk Mitigation

### High-Risk Items

1. **Payment integration** - Use sandbox extensively, have rollback plan
2. **Data migration** - Test thoroughly, have backup strategy
3. **Performance** - Load test early, optimize incrementally
4. **Security** - Continuous scanning, regular audits

### Contingency Plans

- **Delays:** Prioritize P0 features, defer P2 features
- **Blockers:** Escalate immediately, have backup approaches
- **Bugs:** Hotfix process, rollback capability

---

## Success Metrics

### Technical
- 99.9% uptime
- < 500ms API latency (p95)
- < 2s page load time
- 0 critical security vulnerabilities

### Business
- Successful test transactions
- Customer satisfaction > 4.5/5
- Order fulfillment < 24h
- Refund processing < 48h

### Operational
- All runbooks tested
- On-call rotation established
- Monitoring alerts firing correctly
- Incident response < 15min

---

**Next Steps:** Begin Phase 0 immediately. Assign owners for each phase. Set up weekly progress reviews.
