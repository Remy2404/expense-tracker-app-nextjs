describe('next.config security headers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const loadCsp = async () => {
    const { default: nextConfig } = await import('@/next.config');
    const rules = await nextConfig.headers?.();
    const globalRule = rules?.find((rule) => rule.source === '/(.*)');
    return globalRule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? '';
  };

  it('allows required Google/Firebase sources for auth flows', async () => {
    const csp = await loadCsp();

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://apis.google.com');
    expect(csp).toContain('https://accounts.google.com');
    expect(csp).toContain('https://www.gstatic.com');
    expect(csp).toContain('https://*.firebaseapp.com');
  });

  it('includes explicit connect-src origins from env without using wildcard *', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/v1';
    process.env.NEXT_PUBLIC_AI_API_URL = 'https://ai.example.com';
    process.env.API_PROXY_TARGET = 'https://proxy.example.com/';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo.firebaseapp.com';
    process.env.RELAY_ALLOWED_ORIGIN = 'http://localhost:8090';
    process.env.NEXT_PUBLIC_CSP_CONNECT_SRC_EXTRA = 'wss://realtime.example.com,https://extra.example.com/path';

    const csp = await loadCsp();

    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://api.example.com');
    expect(csp).toContain('https://ai.example.com');
    expect(csp).toContain('https://proxy.example.com');
    expect(csp).toContain('https://demo.firebaseapp.com');
    expect(csp).toContain('http://localhost:8090');
    expect(csp).toContain('ws://localhost:8090');
    expect(csp).toContain('wss://realtime.example.com');
    expect(csp).toContain('https://extra.example.com');
    expect(csp).not.toContain('connect-src *');
  });

  it('includes realtime socket URL origins and websocket variants', async () => {
    process.env.NEXT_PUBLIC_REALTIME_SOCKET_URL = 'http://localhost:8090/socket.io';
    process.env.REALTIME_PUBLIC_SOCKET_URL = 'https://realtime.example.com/socket.io';

    const csp = await loadCsp();

    expect(csp).toContain('http://localhost:8090');
    expect(csp).toContain('ws://localhost:8090');
    expect(csp).toContain('https://realtime.example.com');
    expect(csp).toContain('wss://realtime.example.com');
  });

  it('keeps unsafe-eval disabled in production unless explicitly enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CSP_ALLOW_UNSAFE_EVAL = 'false';
    const cspWithoutEval = await loadCsp();
    expect(cspWithoutEval).not.toContain("'unsafe-eval'");

    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.CSP_ALLOW_UNSAFE_EVAL = 'true';
    const cspWithEval = await loadCsp();
    expect(cspWithEval).toContain("'unsafe-eval'");
  });

  it('allows ImageKit origins in img-src for receipt thumbnails', async () => {
    process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/demo-space/';
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = 'https://cdn.example.com/media';

    const csp = await loadCsp();

    expect(csp).toContain('img-src');
    expect(csp).toContain('https://ik.imagekit.io');
    expect(csp).toContain('https://ik.imagekit.io');
    expect(csp).toContain('https://cdn.example.com');
  });
});
