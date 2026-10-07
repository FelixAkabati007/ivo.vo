# ivo Electronics — Architecture Audit & Implementation Blueprint

> **Status:** Architecture and remediation recommendations.  
> **Disclaimer:** This document does NOT claim that database connections, payment processing, production transactions, or end-to-end tests have been executed.  
> **Currency context:** Ghana Cedi (`GHS` / `GH₵`). Currency is explicit and configurable.

---

## 1. Executive Summary

### Current State Assessment

The ivo storefront is a **client-side-only React application** with the following critical architectural issues:

| Severity | Issue | Principle Violated |
|----------|-------|-------------------|
| 🔴 CRITICAL | Neon DB connection string exposed in client bundle (`VITE_NEON_DATABASE_URL`) | #1, #7 |
| 🔴 CRITICAL | Prices, stock, and order state determined by browser | #1, #2 |
| 🔴 CRITICAL | localStorage used as primary order/payment storage | #2, #3 |
| 🟠 HIGH | No idempotency on any financial operation | #4 |
| 🟠 HIGH | No server-side API — all logic in browser | #1 |
| 🟠 HIGH | No payment provider integration | #3 |
| 🟡 MEDIUM | No structured audit trail | #4 |
| 🟡 MEDIUM | No observability (logging, metrics, tracing) | #9 |
| 🟡 MEDIUM | Currency hardcoded in UI templates | Configurable requirement |
| 🟡 MEDIUM | No n8n workflow layer | Automation requirement |
| 🟢 LOW | Product data is static (not from DB) | #2 |

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Untrusted)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React/Vite Storefront                                    │  │
│  │  • Product browsing, search, filtering                   │  │
│  │  • Cart management (optimistic UI)                        │  │
│  │  • Checkout flow (collects data, sends to API)           │  │
│  │  • Order status viewing                                   │  │
│  │  • Configurable currency display                          │  │
│  └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS + Auth
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE API (Trusted)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Commerce API (Node.js / Express / Hono)                  │  │
│  │  • Price calculation (server-authoritative)              │  │
│  │  • Stock validation (server-authoritative)               │  │
│  │  • Order creation (transactional, idempotent)            │  │
│  │  • Payment webhook handling                              │  │
│  │  • Currency configuration                                │  │
│  │  • Rate limiting & auth                                  │  │
│  └──────────┬──────────────────────────────┬────────────────┘  │
│             │                              │                     │
│             ▼                              ▼                     │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  Neon PostgreSQL     │    │  Payment Provider (Paystack/ │   │
│  │  (Source of Truth)   │    │  Stripe / Flutterwave)       │   │
│  │  • Products          │    │  • Server-side callbacks     │   │
│  │  • Orders            │    │  • Webhook verification      │   │
│  │  • Payments          │    │  • Idempotent processing     │   │
│  │  • Audit log         │    └──────────────────────────────┘   │
│  └─────────────────────┘                                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Webhooks / API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATION LAYER (n8n)                         │
│  • Order confirmation emails                                    │
│  • Inventory alerts                                             │
│  • Abandoned cart recovery                                      │
│  • Customer support ticket creation                             │
│  • Analytics & reporting                                        │
│  • Failsafe: cannot mutate payment truth                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Non-Negotiable Principles — Compliance Matrix

| # | Principle | Current State | Required Action |
|---|-----------|---------------|-----------------|
| 1 | Browser is untrusted | ❌ Prices/stock from client | Move all financial logic to server API |
| 2 | Database is source of truth | ❌ localStorage for orders | Neon as authoritative store |
| 3 | No false success | ❌ Timer-based "success" | Payment webhook confirms order |
| 4 | Money ops are auditable & idempotent | ❌ No idempotency | Add idempotency keys, audit log |
| 5 | External events unreliable | ❌ No retry/reconciliation | Add webhook reconciliation |
| 6 | Critical writes are transactional | ❌ No transactions | Use DB transactions for orders |
| 7 | Security is architecture | ❌ DB string in client | Remove client-side DB access |
| 8 | Automations fail safely | ❌ No n8n layer | Add n8n with bounded permissions |
| 9 | Production readiness = evidence | ❌ No tests | Add integration tests |
| 10 | Prefer boring technology | ✅ React/Vite/Neon | Maintain simplicity |

---

## 3. Implementation Phases

### Phase 1: Security & Foundation (CRITICAL — Do First)

1. **Remove client-side Neon connection** — The `VITE_NEON_DATABASE_URL` is exposed in the client bundle. Anyone can read it from the browser's network tab. This must be replaced with server-side API calls.

2. **Introduce server-side API** — A Node.js/Hono API that:
   - Validates all prices server-side
   - Checks stock levels from the database
   - Creates orders transactionally
   - Handles payment webhooks

3. **Configurable currency** — Move currency from hardcoded `GH₵` to a configuration module that supports:
   - `GHS` (Ghana Cedi) — default
   - `USD` — fallback
   - Format patterns per locale

4. **Idempotency layer** — Every money-moving operation gets an idempotency key:
   - Cart additions: `cart_{session}_{product}`
   - Order creation: `order_{client_idempotency_key}`
   - Payment processing: `payment_{order_id}_{attempt}`

### Phase 2: Commerce Core

5. **Proper order lifecycle** — Orders move through verified states:
   ```
   DRAFT → PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED
                              ↓
                           FAILED → RETRY → REFUNDED
   ```

6. **Payment integration** — Server-side webhook handling:
   - Verify webhook signatures
   - Match payments to orders by reference
   - Update order state only after verified payment
   - Handle duplicate webhooks idempotently

7. **Audit trail** — Every state change logged with:
   - Entity type and ID
   - Previous and new state
   - Actor (user/system)
   - Timestamp with timezone
   - Request metadata

### Phase 3: Automation & Operations

8. **n8n workflows** — Bounded automations:
   - Order confirmation emails (triggered by webhook, not client)
   - Low stock alerts (polling, not real-time)
   - Abandoned cart recovery (time-delayed)
   - Daily reconciliation reports

9. **Observability** — Structured logging:
   - Request tracing (correlation IDs)
   - Performance metrics (query latency, API response time)
   - Error tracking with context
   - Business metrics (GMV, conversion rate)

### Phase 4: Experience & Compliance

10. **Accessibility audit** — WCAG 2.1 AA compliance:
    - Keyboard navigation
    - Screen reader support
    - Color contrast ratios
    - Focus management
    - Reduced motion support

11. **Performance budgets** — Lighthouse targets:
    - Performance: 90+
    - Accessibility: 95+
    - Best Practices: 95+
    - SEO: 90+

---

## 4. Critical Security Findings

### Finding 1: Database Connection String Exposure 🔴

**Location:** `src/database/client.ts` line 36
```typescript
connectionString: import.meta.env.VITE_NEON_DATABASE_URL || '',
```

**Risk:** Any user can extract the full database connection string (including credentials) from the browser bundle. This grants direct database access.

**Remediation:**
1. Remove `VITE_NEON_DATABASE_URL` from client-side code immediately
2. Create a server-side API that proxies all database operations
3. Use API keys with scoped permissions for any client-facing endpoints
4. Rotate the Neon database credentials

### Finding 2: Client-Authoritative Pricing 🔴

**Location:** `src/App.tsx` — prices displayed directly from static data
**Risk:** A malicious user could modify prices in the browser before checkout.

**Remediation:** Server must recalculate totals from database prices at order creation time.

### Finding 3: No Payment Verification 🔴

**Location:** `src/App.tsx` — checkout completes after a 2-second timer
**Risk:** Orders can be "paid" without actual payment.

**Remediation:** Payment status must come from verified payment provider webhooks.

---

## 5. Data Flow — Current vs. Target

### Current (Insecure)
```
Browser → localStorage → "Success!" (no verification)
```

### Target (Secure)
```
Browser → API → [Validate stock] → [Calculate price] → [Create order]
  → [Initiate payment] → [Payment provider] → [Webhook callback]
  → [Verify signature] → [Update order status] → [Dispatch events]
  → Browser receives confirmed status
```

---

## 6. Technology Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite + Tailwind | Already in use, maintainable |
| API | Hono (or Express) | Lightweight, TypeScript-native |
| Database | Neon PostgreSQL | Already selected, serverless |
| Payments | Paystack (Ghana-focused) | Supports GHS, mobile money |
| Automation | n8n (self-hosted) | Open-source, flexible |
| Auth | JWT + refresh tokens | Stateless, scalable |
| Logging | Pino (structured JSON) | Fast, parseable |
| Monitoring | Sentry + custom metrics | Error tracking + business KPIs |

---

## 7. Success Criteria

The upgraded system must demonstrate:

- [ ] Zero client-side database credentials
- [ ] All prices validated server-side
- [ ] All orders created via DB transactions
- [ ] Payment status from verified webhooks only
- [ ] Idempotency keys on all financial operations
- [ ] Audit log for every state change
- [ ] Configurable currency (GHS default, extensible)
- [ ] n8n workflows with bounded permissions
- [ ] Lighthouse scores: Perf 90+, A11y 95+, BP 95+
- [ ] Integration tests for critical paths
- [ ] Zero unresolved security findings

---

*Document version: 1.0.0 | Last updated: 2024*
