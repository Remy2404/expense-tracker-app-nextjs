/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates and sanitizes a numeric string parameter
 * @param input - String to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number string or empty string if invalid
 */
export function sanitizeNumericString(
  input: string,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): string {
  if (typeof input !== 'string' || input.trim() === '') {
    return '';
  }

  const sanitized = input.trim();

  // Check if it's a valid number
  if (!/^-?\d+(\.\d+)?$/.test(sanitized)) {
    return '';
  }

  const num = parseFloat(sanitized);

  // Check if it's within bounds
  if (isNaN(num) || num < min || num > max) {
    return '';
  }

  return sanitized;
}

/**
 * Validates and sanitizes a date string
 * @param input - Date string to validate
 * @returns Sanitized date string in YYYY-MM-DD format or empty string if invalid
 */
export function sanitizeDateString(input: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    return '';
  }

  const sanitized = input.trim();

  // Check if it matches YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
    return '';
  }

  // Validate it's a real date
  const date = new Date(sanitized);
  if (isNaN(date.getTime())) {
    return '';
  }

  // Check if date is within reasonable bounds (1900-2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return '';
  }

  return sanitized;
}

/**
 * Validates a category ID (UUID format)
 * @param input - Category ID to validate
 * @returns Sanitized category ID or empty string if invalid
 */
export function sanitizeCategoryId(input: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    return '';
  }

  const sanitized = input.trim();

  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Validates a transaction type filter
 * @param input - Transaction type to validate
 * @returns Valid transaction type or 'all'
 */
export function sanitizeTransactionType(input: string): 'all' | 'expense' | 'income' {
  if (typeof input !== 'string') {
    return 'all';
  }

  const sanitized = input.trim().toLowerCase();

  if (sanitized === 'expense' || sanitized === 'income') {
    return sanitized;
  }

  return 'all';
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long.';
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const complexityCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (complexityCount < 3) {
    return 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters.';
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    return 'Password cannot contain repeated characters (e.g., "aaa", "111").';
  }

  if (/^[0-9]+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    return 'Password cannot be only numbers or only letters.';
  }

  return null;
}
