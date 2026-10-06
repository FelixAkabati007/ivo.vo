/**
 * Validation Schemas for ivo Electronics
 * 
 * Uses Zod for runtime type checking and validation.
 * All user input must be validated before processing.
 */

import { z } from 'zod';

// ============================================
// SHIPPING ADDRESS VALIDATION
// ============================================

export const shippingAddressSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g., +233201234567)')
    .optional()
    .or(z.literal('')),
  
  street: z
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .max(255, 'Street address must be less than 255 characters'),
  
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  
  state: z
    .string()
    .min(2, 'State/Region must be at least 2 characters')
    .max(100, 'State/Region must be less than 100 characters'),
  
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code must be less than 20 characters'),
  
  country: z
    .string()
    .min(2, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

// ============================================
// PAYMENT VALIDATION
// ============================================

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/, 'Please enter a valid 16-digit card number'),
  
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please enter a valid expiry date (MM/YY)')
    .refine((val) => {
      const [month, year] = val.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      return expiry > new Date();
    }, 'Card has expired'),
  
  cvc: z
    .string()
    .regex(/^\d{3,4}$/, 'CVC must be 3 or 4 digits'),
  
  cardholderName: z
    .string()
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(100, 'Cardholder name must be less than 100 characters'),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Validate shipping address
 */
export function validateShippingAddress(data: unknown): ValidationResult<ShippingAddressInput> {
  const result = shippingAddressSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });
  
  return { success: false, errors };
}

/**
 * Validate payment information
 */
export function validatePayment(data: unknown): ValidationResult<PaymentInput> {
  const result = paymentSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });
  
  return { success: false, errors };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string> | undefined): string[] {
  if (!errors) return [];
  return Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
}
