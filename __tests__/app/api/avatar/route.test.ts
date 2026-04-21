/**
 * Avatar API route test suite
 * Tests CSRF verification and SSRF prevention
 */

import { GET } from '@/app/api/avatar/route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

describe('Avatar API - CSRF Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects request with mismatched CSRF token', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg', {
      headers: {
        'x-csrf-token': 'token123',
        'cookie': 'csrf-token=token456',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe('Invalid CSRF token.');
  });

  it('accepts request with matching CSRF token', async () => {
    const mockImageBuffer = new ArrayBuffer(100);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '100',
      }),
      arrayBuffer: async () => mockImageBuffer,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg', {
      headers: {
        'x-csrf-token': 'token123',
        'cookie': 'csrf-token=token123',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('accepts request without CSRF token for backwards compatibility', async () => {
    const mockImageBuffer = new ArrayBuffer(100);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '100',
      }),
      arrayBuffer: async () => mockImageBuffer,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('rejects request with CSRF token but no cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg', {
      headers: {
        'x-csrf-token': 'token123',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('rejects request with cookie but mismatched header token', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg', {
      headers: {
        'x-csrf-token': 'wrong-token',
        'cookie': 'csrf-token=correct-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe('Invalid CSRF token.');
  });
});

describe('Avatar API - SSRF Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts allowlisted Google domain lh3.googleusercontent.com', async () => {
    const mockImageBuffer = new ArrayBuffer(100);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '100',
      }),
      arrayBuffer: async () => mockImageBuffer,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'lh3.googleusercontent.com',
      }),
      expect.any(Object)
    );
  });

  it('accepts allowlisted Google domain lh4.googleusercontent.com', async () => {
    const mockImageBuffer = new ArrayBuffer(100);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': '100',
      }),
      arrayBuffer: async () => mockImageBuffer,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh4.googleusercontent.com/test.jpg');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('blocks subdomain attack attempt', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://evil.lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('blocks non-allowlisted domain', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://evil.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('blocks localhost SSRF attempt', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://localhost/admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('blocks internal IP SSRF attempt', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://192.168.1.1/admin');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects non-HTTPS URLs', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=http://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects missing URL parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/avatar?url=not-a-url');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid avatar URL.');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('Avatar API - Additional Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects response that is not an image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'text/html',
      }),
      arrayBuffer: async () => new ArrayBuffer(100),
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.message).toBe('Avatar response was not an image.');
  });

  it('rejects image larger than 5MB based on content-length header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': (6 * 1024 * 1024).toString(), // 6MB
      }),
      arrayBuffer: async () => new ArrayBuffer(6 * 1024 * 1024),
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.message).toBe('Avatar image too large.');
  });

  it('rejects image larger than 5MB after download', async () => {
    const largeBuffer = new ArrayBuffer(6 * 1024 * 1024); // 6MB
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/jpeg',
      }),
      arrayBuffer: async () => largeBuffer,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.message).toBe('Avatar image too large.');
  });

  it('handles fetch timeout correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('Timeout'), { name: 'TimeoutError' })
    );

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.message).toBe('Avatar fetch timeout.');
  });

  it('handles fetch failure correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Avatar fetch failed.');
  });

  it('handles upstream 404 correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new NextRequest('http://localhost:3000/api/avatar?url=https://lh3.googleusercontent.com/test.jpg');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Avatar fetch failed.');
  });
});
