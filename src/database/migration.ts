/**
 * Neon Database Migration Script
 * 
 * This file contains the SQL migration to set up the ivo Electronics
 * database schema on Neon PostgreSQL.
 * 
 * USAGE:
 * 1. Copy the SQL from schema.ts
 * 2. Run it in your Neon console at https://console.neon.tech
 * 3. Or use the Neon CLI: neonctl sql --file migration.sql
 * 
 * Alternatively, use the Neon API:
 * POST https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}/query
 */

export const MIGRATION_STEPS = [
  {
    step: 1,
    description: 'Create enum types',
    sql: `
      CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
      CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
      CREATE TYPE user_role AS ENUM ('customer', 'admin', 'support');
    `
  },
  {
    step: 2,
    description: 'Create core tables',
    sql: `
      -- Users, Addresses, Products, Cart, Orders, Order Items, Payments, Audit Log
      -- See schema.ts for full definitions
    `
  },
  {
    step: 3,
    description: 'Create indexes for performance',
    sql: `
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_products_price ON products(price);
      CREATE INDEX idx_products_rating ON products(rating DESC);
      CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
    `
  },
  {
    step: 4,
    description: 'Create triggers for auto-updating timestamps',
    sql: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
  },
  {
    step: 5,
    description: 'Seed initial product data',
    sql: `
      -- Products are loaded from the frontend data layer
      -- In production, sync via API or direct INSERT
    `
  }
];

export const NEON_CONNECTION_GUIDE = `
# Connecting ivo to Neon Database

## Step 1: Create a Neon Project
1. Go to https://console.neon.tech
2. Sign up / Log in
3. Click "New Project"
4. Name it "ivo-electronics"
5. Select your region (closest to your users)
6. Click "Create Project"

## Step 2: Get Connection String
1. In your project dashboard, find "Connection Details"
2. Copy the connection string (format: postgresql://user:pass@host/db)
3. It will look like: postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/ivo_db?sslmode=require

## Step 3: Configure Environment
1. Create a .env file in the project root
2. Add: VITE_NEON_DATABASE_URL=your_connection_string_here
3. Restart your dev server

## Step 4: Run Migrations
1. Go to the Neon SQL Editor in your dashboard
2. Copy the schema from src/database/schema.ts (NEON_SCHEMA constant)
3. Paste and execute
4. Verify tables are created

## Step 5: Verify Connection
1. Start the app: npm run dev
2. Look for the database indicator in the bottom-left corner
3. It should show "Neon DB" in green when connected
4. Click it to see connection details and latency

## Connection Pooling
Neon provides built-in connection pooling. The app uses:
- Pool size: 10 connections
- Idle timeout: 30 seconds
- Query timeout: 10 seconds
- Max retries: 3 with exponential backoff

## Security Notes
- Never commit .env files to version control
- Use Neon's branch-based development for safe migrations
- Enable Row Level Security (RLS) for multi-tenant scenarios
- Use connection pooling endpoint for production
`;
