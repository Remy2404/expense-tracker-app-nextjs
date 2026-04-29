import type { NextConfig } from 'next';

const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, '');
const isProduction = process.env.NODE_ENV === 'production';

const toOrigin = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const cspConnectSrcDynamic = [
  toOrigin(process.env.NEXT_PUBLIC_API_BASE_URL),
  ...(process.env.NEXT_PUBLIC_CSP_CONNECT_SRC_EXTRA ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
]
  .filter((entry): entry is string => Boolean(entry))
  .join(' ');

const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com https://apis.google.com https://www.googleapis.com;
  style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com;
  img-src 'self' data: blob: https:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firestore.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com ${cspConnectSrcDynamic};
  frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com https://*.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isProduction ? 'upgrade-insecure-requests;' : ''}
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
