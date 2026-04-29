/**
 * Rate limiting utilities for API routes
 * Uses in-memory storage for simplicity. For production with multiple instances,
 * consider using Redis or a distributed cache.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Optional message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Default rate limit configurations for different routes
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again in 1 hour.',
  },
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please try again later.',
  },
} as const;

/**
 * Gets the client identifier from the request
 * Uses IP address and User-Agent for fingerprinting
 * @param request - Incoming request
 * @returns Client identifier string
 */
function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a fingerprint combining IP and User-Agent
  return `${ip}:${userAgent}`;
}

/**
 * Checks if a request should be rate limited
 * @param request - Incoming request
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and remaining requests
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetTime: number } {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;

  let entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      isLimited: false,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment the count
  entry.count++;

  // Check if limit is exceeded
  if (entry.count > config.maxRequests) {
    return {
      isLimited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    isLimited: false,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Creates a rate limit response with appropriate headers
 * @param config - Rate limit configuration
 * @param resetTime - Time when the rate limit resets
 * @returns NextResponse with 429 status
 */
export function createRateLimitResponse(config: RateLimitConfig, resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: config.message || 'Too many requests',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}

/**
 * Adds rate limit headers to a response
 * @param response - Response to add headers to
 * @param config - Rate limit configuration
 * @param remaining - Remaining requests
 * @param resetTime - Time when the rate limit resets
 * @returns Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: Response,
  config: RateLimitConfig,
  remaining: number,
  resetTime: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', resetTime.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
