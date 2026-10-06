/**
 * Database Module - Public API
 * 
 * Central export point for all database operations.
 * Import from this file instead of individual modules.
 */

// Client & Connection
export { 
  initializeNeon, 
  executeQuery, 
  testConnection, 
  getConnectionState, 
  isNeonConfigured,
  getSqlClient,
  type ConnectionState,
  type NeonConfig 
} from './client';

// Queries
export {
  getAllProducts,
  getProductsByCategory,
  searchProducts,
  getProductById,
  getProductsSortedByPriceLow,
  getProductsSortedByPriceHigh,
  getCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  createOrder,
  addOrderItem,
  getOrderById,
  getOrdersBySession,
  createPayment,
  logAuditEvent,
  getDatabaseStats,
} from './queries';

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

// Schema
export { NEON_SCHEMA, SEED_PRODUCTS_SQL } from './schema';
