/**
 * proxy rate limiting test suite
 * Tests rate limiting behavior for login and signup routes
 */

import { proxy } from '@/proxy';
import { NextRequest, NextResponse } from 'next/server';

// Helper to create mock request
function createMockRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: new Headers(headers),
  });
}

describe('proxy - Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    jest.clearAllMocks();
  });

  describe('Login rate limiting', () => {
    it('allows first request within limit', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('allows up to 5 requests within 15 minutes', () => {
      const headers = {
        'x-forwarded-for': '192.168.1.2',
        'user-agent': 'test-agent',
      };

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('/login', headers);
        const response = proxy(request);
        expect(response.status).toBe(200);
      }
    });

    it('returns 429 after exceeding 5 requests', async () => {
      const headers = {
        'x-forwarded-for': '192.168.1.3',
        'user-agent': 'test-agent',
      };

      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('/login', headers);
        proxy(request);
      }

      // 6th request should be rate limited
      const request = createMockRequest('/login', headers);
      const response = proxy(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many login attempts. Please try again in 15 minutes.');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('includes retry-after header in 429 response', async () => {
      const headers = {
        'x-forwarded-for': '192.168.1.4',
        'user-agent': 'test-agent',
      };

      // Exceed limit
      for (let i = 0; i < 6; i++) {
        const request = createMockRequest('/login', headers);
        proxy(request);
      }

      const request = createMockRequest('/login', headers);
      const response = proxy(request);

      expect(response.headers.get('Retry-After')).toBeTruthy();
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(15 * 60); // Max 15 minutes
    });

    it('tracks different IPs separately', () => {
      const ip1Headers = {
        'x-forwarded-for': '192.168.1.5',
        'user-agent': 'test-agent',
      };
      const ip2Headers = {
        'x-forwarded-for': '192.168.1.6',
        'user-agent': 'test-agent',
      };

      // IP1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('/login', ip1Headers);
        proxy(request);
      }

      // IP2 should still be able to make requests
      const request = createMockRequest('/login', ip2Headers);
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });
  });

  describe('Signup rate limiting', () => {
    it('allows first request within limit', () => {
      const request = createMockRequest('/signup', {
        'x-forwarded-for': '192.168.2.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('2');
    });

    it('allows up to 3 requests within 1 hour', () => {
      const headers = {
        'x-forwarded-for': '192.168.2.2',
        'user-agent': 'test-agent',
      };

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest('/signup', headers);
        const response = proxy(request);
        expect(response.status).toBe(200);
      }
    });

    it('returns 429 after exceeding 3 requests', async () => {
      const headers = {
        'x-forwarded-for': '192.168.2.3',
        'user-agent': 'test-agent',
      };

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest('/signup', headers);
        proxy(request);
      }

      // 4th request should be rate limited
      const request = createMockRequest('/signup', headers);
      const response = proxy(request);

      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many signup attempts. Please try again in 1 hour.');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('includes retry-after header in 429 response', async () => {
      const headers = {
        'x-forwarded-for': '192.168.2.4',
        'user-agent': 'test-agent',
      };

      // Exceed limit
      for (let i = 0; i < 4; i++) {
        const request = createMockRequest('/signup', headers);
        proxy(request);
      }

      const request = createMockRequest('/signup', headers);
      const response = proxy(request);

      expect(response.headers.get('Retry-After')).toBeTruthy();
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60 * 60); // Max 1 hour
    });
  });

  describe('Client identification', () => {
    it('uses x-forwarded-for header for IP', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.3.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
    });

    it('uses x-real-ip header when x-forwarded-for is missing', () => {
      const request = createMockRequest('/login', {
        'x-real-ip': '192.168.3.2',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
    });

    it('uses cf-connecting-ip header when available', () => {
      const request = createMockRequest('/login', {
        'cf-connecting-ip': '192.168.3.3',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
    });

    it('handles multiple IPs in x-forwarded-for', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.3.4, 10.0.0.1, 172.16.0.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
    });

    it('includes user-agent in client identification', () => {
      const headers1 = {
        'x-forwarded-for': '192.168.3.5',
        'user-agent': 'agent-1',
      };
      const headers2 = {
        'x-forwarded-for': '192.168.3.5',
        'user-agent': 'agent-2',
      };

      // Same IP, different user agents should be tracked separately
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('/login', headers1);
        proxy(request);
      }

      // Different user agent should still be able to make requests
      const request = createMockRequest('/login', headers2);
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });
  });

  describe('Non-rate-limited routes', () => {
    it('does not rate limit other routes', () => {
      const request = createMockRequest('/dashboard', {
        'x-forwarded-for': '192.168.4.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
    });

    it('allows unlimited requests to non-protected routes', () => {
      const headers = {
        'x-forwarded-for': '192.168.4.2',
        'user-agent': 'test-agent',
      };

      // Make many requests
      for (let i = 0; i < 20; i++) {
        const request = createMockRequest('/api/transactions', headers);
        const response = proxy(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Rate limit headers', () => {
    it('includes X-RateLimit-Limit header', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.5.1',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('includes X-RateLimit-Remaining header', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.5.2',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('includes X-RateLimit-Reset header', () => {
      const request = createMockRequest('/login', {
        'x-forwarded-for': '192.168.5.3',
        'user-agent': 'test-agent',
      });

      const response = proxy(request);

      const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
      expect(resetTime).toBeGreaterThan(Date.now());
    });

    it('decrements X-RateLimit-Remaining with each request', () => {
      const headers = {
        'x-forwarded-for': '192.168.5.4',
        'user-agent': 'test-agent',
      };

      for (let i = 0; i < 5; i++) {
        const request = createMockRequest('/login', headers);
        const response = proxy(request);
        expect(response.headers.get('X-RateLimit-Remaining')).toBe((4 - i).toString());
      }
    });
  });
});
