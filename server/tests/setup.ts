/**
 * Test Setup
 * 
 * Initializes test environment before running tests.
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/ivo_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PAYSTACK_SECRET_KEY = 'test_paystack_secret_key';
process.env.PAYSTACK_WEBHOOK_SECRET = 'test_webhook_secret';

// Mock database connection for unit tests
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

beforeEach(() => {
  // Clear any mocks before each test
  vi.clearAllMocks();
});

// Global test utilities
export const testUtils = {
  /**
   * Generate a test UUID
   */
  generateTestId: () => {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },

  /**
   * Generate test email
   */
  generateTestEmail: () => {
    return `test-${Date.now()}@example.com`;
  },

  /**
   * Generate test phone number
   */
  generateTestPhone: () => {
    return `+233${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
  },

  /**
   * Create test user data
   */
  createTestUser: (overrides = {}) => {
    return {
      id: testUtils.generateTestId(),
      email: testUtils.generateTestEmail(),
      phone: testUtils.generateTestPhone(),
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashed_password',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create test product data
   */
  createTestProduct: (overrides = {}) => {
    return {
      id: testUtils.generateTestId(),
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      price: '100.00',
      originalPrice: '150.00',
      currency: 'GHS',
      stockQuantity: 50,
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create test order data
   */
  createTestOrder: (overrides = {}) => {
    return {
      id: testUtils.generateTestId(),
      orderNumber: `IVO-${Date.now()}`,
      userId: testUtils.generateTestId(),
      status: 'pending_payment',
      paymentStatus: 'pending',
      subtotal: '100.00',
      discountAmount: '0.00',
      shippingAmount: '10.00',
      taxAmount: '0.00',
      grandTotal: '110.00',
      currency: 'GHS',
      shippingAddressSnapshot: {
        firstName: 'Test',
        lastName: 'User',
        email: testUtils.generateTestEmail(),
        phone: testUtils.generateTestPhone(),
        street: '123 Test St',
        city: 'Accra',
        state: 'Greater Accra',
        postalCode: '12345',
        country: 'Ghana',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Wait for async operations
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock console to capture output
   */
  mockConsole: () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
    };
    return {
      logs,
      restore: () => {
        console.log = originalLog;
      },
    };
  },
};
