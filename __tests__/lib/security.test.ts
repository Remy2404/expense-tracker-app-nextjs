/**
 * Security utilities test suite
 * Tests input sanitization and validation functions
 */

import {
  sanitizeString,
  sanitizeNumericString,
  sanitizeDateString,
  sanitizeCategoryId,
  sanitizeTransactionType,
  validatePasswordStrength,
} from '@/lib/security';

describe('sanitizeString', () => {
  // AAA Pattern: Arrange, Act, Assert

  it('removes control characters from input', () => {
    const input = 'Hello\x00World\x1F\x7F';
    const result = sanitizeString(input);
    expect(result).toBe('HelloWorld');
  });

  it('removes null bytes from input', () => {
    const input = 'Test\x00String';
    const result = sanitizeString(input);
    expect(result).toBe('TestString');
  });

  it('trims whitespace from input', () => {
    const input = '  Hello World  ';
    const result = sanitizeString(input);
    expect(result).toBe('Hello World');
  });

  it('enforces maximum length', () => {
    const input = 'a'.repeat(2000);
    const result = sanitizeString(input, 100);
    expect(result).toHaveLength(100);
  });

  it('returns empty string for non-string input', () => {
    const result = sanitizeString(123 as any);
    expect(result).toBe('');
  });

  it('handles empty string input', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });

  it('preserves valid alphanumeric and special characters', () => {
    const input = 'Valid-String_123!@#';
    const result = sanitizeString(input);
    expect(result).toBe('Valid-String_123!@#');
  });
});

describe('sanitizeNumericString', () => {
  it('returns valid numeric string within bounds', () => {
    const input = '42';
    const result = sanitizeNumericString(input, 0, 100);
    expect(result).toBe('42');
  });

  it('returns empty string for value below minimum', () => {
    const input = '5';
    const result = sanitizeNumericString(input, 10, 100);
    expect(result).toBe('');
  });

  it('returns empty string for value above maximum', () => {
    const input = '150';
    const result = sanitizeNumericString(input, 0, 100);
    expect(result).toBe('');
  });

  it('handles negative numbers correctly', () => {
    const input = '-50';
    const result = sanitizeNumericString(input, -100, 0);
    expect(result).toBe('-50');
  });

  it('handles decimal numbers correctly', () => {
    const input = '42.5';
    const result = sanitizeNumericString(input, 0, 100);
    expect(result).toBe('42.5');
  });

  it('returns empty string for non-numeric input', () => {
    const input = 'abc123';
    const result = sanitizeNumericString(input);
    expect(result).toBe('');
  });

  it('returns empty string for empty input', () => {
    const input = '';
    const result = sanitizeNumericString(input);
    expect(result).toBe('');
  });

  it('returns empty string for non-string input', () => {
    const result = sanitizeNumericString(123 as any);
    expect(result).toBe('');
  });

  it('trims whitespace before validation', () => {
    const input = '  42  ';
    const result = sanitizeNumericString(input, 0, 100);
    expect(result).toBe('42');
  });
});

describe('sanitizeDateString', () => {
  it('returns valid date string in YYYY-MM-DD format', () => {
    const input = '2024-03-15';
    const result = sanitizeDateString(input);
    expect(result).toBe('2024-03-15');
  });

  it('returns empty string for invalid date format', () => {
    const input = '15-03-2024';
    const result = sanitizeDateString(input);
    expect(result).toBe('');
  });

  it('returns empty string for invalid date', () => {
    const input = '2024-02-30';
    const result = sanitizeDateString(input);
    expect(result).toBe('');
  });

  it('returns empty string for year below 1900', () => {
    const input = '1899-12-31';
    const result = sanitizeDateString(input);
    expect(result).toBe('');
  });

  it('returns empty string for year above 2100', () => {
    const input = '2101-01-01';
    const result = sanitizeDateString(input);
    expect(result).toBe('');
  });

  it('returns empty string for non-string input', () => {
    const result = sanitizeDateString(20240315 as any);
    expect(result).toBe('');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeDateString('');
    expect(result).toBe('');
  });

  it('trims whitespace before validation', () => {
    const input = '  2024-03-15  ';
    const result = sanitizeDateString(input);
    expect(result).toBe('2024-03-15');
  });
});

describe('sanitizeCategoryId', () => {
  it('returns valid UUID string', () => {
    const input = '550e8400-e29b-41d4-a716-446655440000';
    const result = sanitizeCategoryId(input);
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('accepts uppercase UUID', () => {
    const input = '550E8400-E29B-41D4-A716-446655440000';
    const result = sanitizeCategoryId(input);
    expect(result).toBe('550E8400-E29B-41D4-A716-446655440000');
  });

  it('returns empty string for invalid UUID format', () => {
    const input = 'not-a-uuid';
    const result = sanitizeCategoryId(input);
    expect(result).toBe('');
  });

  it('returns empty string for UUID with wrong segment lengths', () => {
    const input = '550e8400-e29b-41d4-a716-44665544000';
    const result = sanitizeCategoryId(input);
    expect(result).toBe('');
  });

  it('returns empty string for non-string input', () => {
    const result = sanitizeCategoryId(123 as any);
    expect(result).toBe('');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeCategoryId('');
    expect(result).toBe('');
  });

  it('trims whitespace before validation', () => {
    const input = '  550e8400-e29b-41d4-a716-446655440000  ';
    const result = sanitizeCategoryId(input);
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('sanitizeTransactionType', () => {
  it('returns expense for valid expense input', () => {
    const input = 'expense';
    const result = sanitizeTransactionType(input);
    expect(result).toBe('expense');
  });

  it('returns income for valid income input', () => {
    const input = 'income';
    const result = sanitizeTransactionType(input);
    expect(result).toBe('income');
  });

  it('returns all for invalid input', () => {
    const input = 'invalid';
    const result = sanitizeTransactionType(input);
    expect(result).toBe('all');
  });

  it('handles case insensitivity', () => {
    const input = 'EXPENSE';
    const result = sanitizeTransactionType(input);
    expect(result).toBe('expense');
  });

  it('returns all for non-string input', () => {
    const result = sanitizeTransactionType(123 as any);
    expect(result).toBe('all');
  });

  it('trims whitespace before validation', () => {
    const input = '  income  ';
    const result = sanitizeTransactionType(input);
    expect(result).toBe('income');
  });
});

describe('validatePasswordStrength', () => {
  // Test 12+ character requirement
  it('rejects password shorter than 12 characters', () => {
    const password = 'Short1!';
    const result = validatePasswordStrength(password);
    expect(result).toBe('Password must be at least 12 characters long.');
  });

  it('accepts password with exactly 12 characters', () => {
    const password = 'Valid1Pass!@';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });

  // Test complexity requirements
  it('rejects password without sufficient complexity', () => {
    const password = 'alllowercase';
    const result = validatePasswordStrength(password);
    expect(result).toBe('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters.');
  });

  it('accepts password with uppercase, lowercase, and numbers', () => {
    const password = 'ValidPass123';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });

  it('accepts password with uppercase, lowercase, and special chars', () => {
    const password = 'ValidPass!@#';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });

  it('accepts password with lowercase, numbers, and special chars', () => {
    const password = 'validpass123!@#';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });

  it('accepts password with all four complexity types', () => {
    const password = 'ValidPass123!';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });

  // Test weak pattern detection
  it('rejects password with repeated characters', () => {
    const password = 'ValidPassaaa123!';
    const result = validatePasswordStrength(password);
    expect(result).toBe('Password cannot contain repeated characters (e.g., "aaa", "111").');
  });

  it('rejects password with only numbers', () => {
    const password = '123456789012';
    const result = validatePasswordStrength(password);
    expect(result).toBe('Password cannot be only numbers or only letters.');
  });

  it('rejects password with only letters', () => {
    const password = 'OnlyLettersHere';
    const result = validatePasswordStrength(password);
    expect(result).toBe('Password cannot be only numbers or only letters.');
  });

  it('accepts strong password with mixed characters', () => {
    const password = 'MySecureP@ssw0rd2024';
    const result = validatePasswordStrength(password);
    expect(result).toBeNull();
  });
});
