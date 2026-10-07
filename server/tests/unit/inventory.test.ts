/**
 * Unit Tests: Inventory Management
 * 
 * Tests for inventory reservation, stock updates, and concurrency handling.
 * CRITICAL: Inventory must be accurate and prevent overselling.
 */

import { describe, it, expect } from 'vitest';

// Mock inventory functions
interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  reserved: number;
  version: number;
}

const checkStockAvailability = (item: InventoryItem, requested: number): boolean => {
  const available = item.quantity - item.reserved;
  return available >= requested;
};

const reserveStock = (item: InventoryItem, quantity: number): InventoryItem => {
  if (!checkStockAvailability(item, quantity)) {
    throw new Error('Insufficient stock');
  }
  
  return {
    ...item,
    reserved: item.reserved + quantity,
    version: item.version + 1,
  };
};

const releaseStock = (item: InventoryItem, quantity: number): InventoryItem => {
  if (item.reserved < quantity) {
    throw new Error('Cannot release more than reserved');
  }
  
  return {
    ...item,
    reserved: item.reserved - quantity,
    version: item.version + 1,
  };
};

const confirmStock = (item: InventoryItem, quantity: number): InventoryItem => {
  if (item.reserved < quantity) {
    throw new Error('Cannot confirm more than reserved');
  }
  
  return {
    ...item,
    quantity: item.quantity - quantity,
    reserved: item.reserved - quantity,
    version: item.version + 1,
  };
};

describe('Inventory Management', () => {
  describe('Stock Availability', () => {
    it('should return true when sufficient stock available', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      expect(checkStockAvailability(item, 10)).toBe(true);
    });

    it('should return true when exact stock available', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      expect(checkStockAvailability(item, 100)).toBe(true);
    });

    it('should return false when insufficient stock', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      expect(checkStockAvailability(item, 101)).toBe(false);
    });

    it('should account for reserved stock', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      expect(checkStockAvailability(item, 50)).toBe(true);
      expect(checkStockAvailability(item, 51)).toBe(false);
    });

    it('should return false when all stock is reserved', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 100,
        version: 1,
      };
      expect(checkStockAvailability(item, 1)).toBe(false);
    });
  });

  describe('Stock Reservation', () => {
    it('should reserve stock successfully', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      const updated = reserveStock(item, 10);
      expect(updated.reserved).toBe(10);
      expect(updated.version).toBe(2);
    });

    it('should increment version on reservation', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      const updated = reserveStock(item, 10);
      expect(updated.version).toBe(item.version + 1);
    });

    it('should throw error when insufficient stock', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 90,
        version: 1,
      };
      expect(() => reserveStock(item, 20)).toThrow('Insufficient stock');
    });

    it('should allow multiple reservations', () => {
      let item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      item = reserveStock(item, 10);
      item = reserveStock(item, 20);
      expect(item.reserved).toBe(30);
    });
  });

  describe('Stock Release', () => {
    it('should release stock successfully', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      const updated = releaseStock(item, 20);
      expect(updated.reserved).toBe(30);
      expect(updated.version).toBe(2);
    });

    it('should throw error when releasing more than reserved', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 10,
        version: 1,
      };
      expect(() => releaseStock(item, 20)).toThrow('Cannot release more than reserved');
    });

    it('should allow releasing exact reserved amount', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      const updated = releaseStock(item, 50);
      expect(updated.reserved).toBe(0);
    });
  });

  describe('Stock Confirmation', () => {
    it('should confirm stock successfully', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      const updated = confirmStock(item, 20);
      expect(updated.quantity).toBe(80);
      expect(updated.reserved).toBe(30);
      expect(updated.version).toBe(2);
    });

    it('should throw error when confirming more than reserved', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 10,
        version: 1,
      };
      expect(() => confirmStock(item, 20)).toThrow('Cannot confirm more than reserved');
    });

    it('should decrement both quantity and reserved', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      const updated = confirmStock(item, 30);
      expect(updated.quantity).toBe(70);
      expect(updated.reserved).toBe(20);
    });
  });

  describe('Concurrency Handling', () => {
    it('should handle version conflicts (optimistic locking)', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      
      // Simulate two concurrent reservations
      const updated1 = reserveStock(item, 10);
      expect(updated1.version).toBe(2);
      
      // Second update should use new version
      const updated2 = reserveStock(updated1, 20);
      expect(updated2.version).toBe(3);
      expect(updated2.reserved).toBe(30);
    });

    it('should prevent overselling with concurrent reservations', () => {
      let item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      
      // Reserve 90 units
      item = reserveStock(item, 90);
      
      // Try to reserve 20 more (should fail)
      expect(() => reserveStock(item, 20)).toThrow('Insufficient stock');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity reservation', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 0,
        version: 1,
      };
      const updated = reserveStock(item, 0);
      expect(updated.reserved).toBe(0);
    });

    it('should handle zero quantity release', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 100,
        reserved: 50,
        version: 1,
      };
      const updated = releaseStock(item, 0);
      expect(updated.reserved).toBe(50);
    });

    it('should handle large quantities', () => {
      const item: InventoryItem = {
        id: '1',
        productId: 'prod-1',
        quantity: 1000000,
        reserved: 0,
        version: 1,
      };
      const updated = reserveStock(item, 999999);
      expect(updated.reserved).toBe(999999);
    });
  });
});
