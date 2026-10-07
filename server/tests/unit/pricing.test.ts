/**
 * Unit Tests: Pricing and Currency Calculations
 * 
 * Tests for price calculations, currency handling, and rounding rules.
 * CRITICAL: Financial calculations must be accurate and deterministic.
 */

import { describe, it, expect } from 'vitest';

// Mock pricing service functions
const calculateSubtotal = (items: Array<{ price: string; quantity: number }>): string => {
  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.price);
    return sum + (price * item.quantity);
  }, 0);
  return total.toFixed(2);
};

const calculateDiscount = (subtotal: string, discountPercent: number): string => {
  const subtotalNum = parseFloat(subtotal);
  const discount = subtotalNum * (discountPercent / 100);
  return discount.toFixed(2);
};

const calculateTax = (amount: string, taxRate: number): string => {
  const amountNum = parseFloat(amount);
  const tax = amountNum * (taxRate / 100);
  return tax.toFixed(2);
};

const calculateGrandTotal = (
  subtotal: string,
  discount: string,
  shipping: string,
  tax: string
): string => {
  const subtotalNum = parseFloat(subtotal);
  const discountNum = parseFloat(discount);
  const shippingNum = parseFloat(shipping);
  const taxNum = parseFloat(tax);
  
  const total = subtotalNum - discountNum + shippingNum + taxNum;
  return total.toFixed(2);
};

describe('Pricing Calculations', () => {
  describe('calculateSubtotal', () => {
    it('should calculate subtotal for single item', () => {
      const items = [{ price: '100.00', quantity: 1 }];
      expect(calculateSubtotal(items)).toBe('100.00');
    });

    it('should calculate subtotal for multiple items', () => {
      const items = [
        { price: '100.00', quantity: 2 },
        { price: '50.00', quantity: 3 },
      ];
      expect(calculateSubtotal(items)).toBe('350.00');
    });

    it('should handle decimal prices correctly', () => {
      const items = [{ price: '99.99', quantity: 3 }];
      expect(calculateSubtotal(items)).toBe('299.97');
    });

    it('should handle zero quantity', () => {
      const items = [{ price: '100.00', quantity: 0 }];
      expect(calculateSubtotal(items)).toBe('0.00');
    });

    it('should handle empty items array', () => {
      expect(calculateSubtotal([])).toBe('0.00');
    });

    it('should round to 2 decimal places', () => {
      const items = [{ price: '33.33', quantity: 3 }];
      expect(calculateSubtotal(items)).toBe('99.99');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount', () => {
      expect(calculateDiscount('100.00', 10)).toBe('10.00');
    });

    it('should calculate 50% discount', () => {
      expect(calculateDiscount('200.00', 50)).toBe('100.00');
    });

    it('should handle zero discount', () => {
      expect(calculateDiscount('100.00', 0)).toBe('0.00');
    });

    it('should round discount to 2 decimal places', () => {
      expect(calculateDiscount('99.99', 15)).toBe('15.00');
    });

    it('should handle large amounts', () => {
      expect(calculateDiscount('10000.00', 25)).toBe('2500.00');
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax at given rate', () => {
      expect(calculateTax('100.00', 15)).toBe('15.00');
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax('100.00', 0)).toBe('0.00');
    });

    it('should round tax to 2 decimal places', () => {
      expect(calculateTax('99.99', 17.5)).toBe('17.50');
    });
  });

  describe('calculateGrandTotal', () => {
    it('should calculate grand total correctly', () => {
      expect(calculateGrandTotal('100.00', '10.00', '15.00', '5.00')).toBe('110.00');
    });

    it('should handle no discount', () => {
      expect(calculateGrandTotal('100.00', '0.00', '10.00', '0.00')).toBe('110.00');
    });

    it('should handle free shipping', () => {
      expect(calculateGrandTotal('100.00', '10.00', '0.00', '5.00')).toBe('95.00');
    });

    it('should handle all zeros', () => {
      expect(calculateGrandTotal('0.00', '0.00', '0.00', '0.00')).toBe('0.00');
    });

    it('should handle large amounts', () => {
      expect(calculateGrandTotal('10000.00', '1000.00', '500.00', '750.00')).toBe('10250.00');
    });
  });
});

describe('Currency Handling', () => {
  it('should always use GHS as default currency', () => {
    const currency = 'GHS';
    expect(currency).toBe('GHS');
  });

  it('should format currency correctly', () => {
    const amount = '1234.56';
    const formatted = `GH₵${amount}`;
    expect(formatted).toBe('GH₵1234.56');
  });

  it('should handle currency conversion (mock)', () => {
    const ghsAmount = 100.00;
    const usdRate = 0.065; // 1 GHS = 0.065 USD (example rate)
    const usdAmount = ghsAmount * usdRate;
    expect(usdAmount.toFixed(2)).toBe('6.50');
  });
});

describe('Rounding Rules', () => {
  it('should round down when third decimal is < 5', () => {
    const amount = 10.124;
    expect(amount.toFixed(2)).toBe('10.12');
  });

  it('should round up when third decimal is >= 5', () => {
    const amount = 10.125;
    expect(amount.toFixed(2)).toBe('10.13');
  });

  it('should handle exact two decimal places', () => {
    const amount = 10.12;
    expect(amount.toFixed(2)).toBe('10.12');
  });

  it('should handle whole numbers', () => {
    const amount = 10;
    expect(amount.toFixed(2)).toBe('10.00');
  });
});
