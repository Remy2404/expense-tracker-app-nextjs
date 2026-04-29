import nextConfig from '@/next.config';

describe('next.config security headers', () => {
  it('allows required Google/Firebase sources for auth flows', async () => {
    const rules = await nextConfig.headers?.();
    const globalRule = rules?.find((rule) => rule.source === '/(.*)');
    const csp = globalRule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://apis.google.com');
    expect(csp).toContain('https://accounts.google.com');
    expect(csp).toContain('https://www.gstatic.com');
    expect(csp).toContain('https://*.firebaseapp.com');
  });
});
