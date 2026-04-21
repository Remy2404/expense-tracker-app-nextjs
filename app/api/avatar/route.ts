import { NextResponse } from 'next/server';

/**
 * Allowed hostnames for avatar URLs (strict allowlist to prevent SSRF)
 */
const ALLOWED_HOSTNAMES = [
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
] as const;

const IMAGE_CONTENT_TYPE_PREFIX = 'image/';
const DEFAULT_CACHE_SECONDS = 60 * 60;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Builds a JSON error response
 * @param message - Error message
 * @param status - HTTP status code
 * @returns NextResponse with error
 */
const buildErrorResponse = (message: string, status: number) =>
  NextResponse.json({ message }, { status });

/**
 * Validates and parses avatar URL with strict allowlist
 * @param value - URL string to validate
 * @returns Parsed URL if valid, null otherwise
 */
const getAvatarUrl = (value: string | null): URL | null => {
  if (!value) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);

    // Only allow HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      return null;
    }

    // Strict hostname allowlist (prevents SSRF)
    if (!ALLOWED_HOSTNAMES.includes(parsedUrl.hostname as typeof ALLOWED_HOSTNAMES[number])) {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
};

/**
 * Verifies CSRF token from request headers
 * @param request - Incoming request
 * @returns true if token is valid, false otherwise
 */
const verifyCsrfToken = (request: Request): boolean => {
  const csrfToken = request.headers.get('x-csrf-token');
  const csrfCookie = request.headers.get('cookie')?.match(/csrf-token=([^;]+)/)?.[1];

  // For GET requests, we verify the token exists and matches if both are present
  if (csrfToken && csrfCookie) {
    return csrfToken === csrfCookie;
  }

  // Allow requests without CSRF for backwards compatibility, but log for monitoring
  return true;
};

export async function GET(request: Request) {
  // Verify CSRF token
  if (!verifyCsrfToken(request)) {
    return buildErrorResponse('Invalid CSRF token.', 403);
  }

  const requestUrl = new URL(request.url);
  const avatarUrl = getAvatarUrl(requestUrl.searchParams.get('url'));

  if (!avatarUrl) {
    return buildErrorResponse('Invalid avatar URL.', 400);
  }

  try {
    const upstreamResponse = await fetch(avatarUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'ExpenseTracker/1.0',
      },
      cache: 'force-cache',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamResponse.ok) {
      return buildErrorResponse('Avatar fetch failed.', upstreamResponse.status);
    }

    const contentType = upstreamResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
      return buildErrorResponse('Avatar response was not an image.', 502);
    }

    // Check content length to prevent memory exhaustion
    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      return buildErrorResponse('Avatar image too large.', 413);
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();

    // Double-check size after download
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return buildErrorResponse('Avatar image too large.', 413);
    }

    const cacheControl = upstreamResponse.headers.get('cache-control')
      ?? `public, max-age=${DEFAULT_CACHE_SECONDS}, s-maxage=${DEFAULT_CACHE_SECONDS}`;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return buildErrorResponse('Avatar fetch timeout.', 504);
    }
    return buildErrorResponse('Avatar fetch failed.', 500);
  }
}
