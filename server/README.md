# ivo Electronics — Server API Implementation

This directory contains the server-side API implementation for ivo Electronics.

## Architecture

```
Client (React/Vite) → Server API → Neon Postgres
                         ↓
                    Payment Provider (Paystack)
                         ↓
                    n8n Workflows (async)
```

## Quick Start

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create `.env` in the server directory:

```bash
# Database (NEVER expose to client)
NEON_DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Payments (Paystack)
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=...

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=...

# Object Storage
S3_BUCKET=ivo-products
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# AI (Optional)
ANTHROPIC_API_KEY=...

# Environment
NODE_ENV=development
API_URL=http://localhost:3000
```

## API Endpoints

### Public
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/cart/:sessionId/items` - Add to cart
- `POST /api/orders` - Create order
- `POST /api/payments/initialize` - Start payment
- `POST /api/payments/webhook` - Payment webhook

### Protected (Auth Required)
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/addresses` - Add address
- `PUT /api/addresses/:id` - Update address

### Admin
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - All orders
- `GET /api/admin/analytics` - Analytics data

## Security

- All secrets in environment variables (never VITE_ prefix)
- JWT authentication for protected routes
- Rate limiting on all endpoints
- Input validation with Zod
- Parameterized SQL queries
- Webhook signature verification
- CORS configured for specific origins

## Testing

```bash
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run test:api   # API integration tests
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Other Platforms
```bash
npm run build
npm start
```

## Monitoring

- Structured JSON logs
- Error tracking via Sentry
- Metrics via Prometheus
- Health check at `/api/health`
