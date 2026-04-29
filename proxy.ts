import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rate limiting store (in-memory)
 * For production with multiple instances, use Redis or a distributed cache
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configurations for different routes
 */
const RATE_LIMITS = {
  '/login': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  '/signup': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again in 1 hour.',
  },
};

/**
 * Gets client identifier from request
 * @param request - Incoming request
 * @returns Client identifier string
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${ip}:${userAgent}`;
}

/**
 * Checks if request should be rate limited
 * @param request - Incoming request
 * @param pathname - Request pathname
 * @returns Rate limit result
 */
function checkRateLimit(request: NextRequest, pathname: string): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS];
} | null {
  const config = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  if (!config) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const key = `${pathname}:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

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
      config,
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
      config,
    };
  }

  return {
    isLimited: false,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
    config,
  };
}

/**
 * Proxy function to handle rate limiting (Next.js 16+ proxy convention)
 * @param request - Incoming request
 * @returns NextResponse
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check rate limit for protected routes
  const rateLimitResult = checkRateLimit(request, pathname);

  if (rateLimitResult) {
    const { isLimited, remaining, resetTime, config } = rateLimitResult;

    if (isLimited) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return new NextResponse(
        JSON.stringify({
          error: config.message,
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

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    return response;
  }

  return NextResponse.next();
}

/**
 * proxy configuration
 * Only run on specific routes
 */
export const config = {
  matcher: ['/login', '/signup'],
};
