/**
 * Database Module - Public API
 * 
 * Central export point for all database operations.
 * Import from this file instead of individual modules.
 */

// Service (High-level API)
export {
  initializeDatabase,
  checkDatabaseHealth,
  getProducts,
  getProductsByCategory as getFilteredProducts,
  searchProducts as searchFilteredProducts,
  getProductById as findProduct,
  getCartItems as loadCart,
  saveCartItems as persistCart,
  clearCart as emptyCart,
  getOrders as loadOrders,
  createNewOrder,
  getDatabaseMode,
  isNeonActive,
  getNeonInfo,
  type CartItem,
  type Order,
  type ShippingAddress,
  type DatabaseStatus,
} from './service';

// Schema (for reference)
export { NEON_SCHEMA, SEED_PRODUCTS_SQL } from './schema';
