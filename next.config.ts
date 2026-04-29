import type { NextConfig } from 'next';

const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, '');

const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : '',
    'https://apis.google.com',
    'https://accounts.google.com',
    'https://www.gstatic.com',
  ]
    .filter(Boolean)
    .join(' '),
  [
    'connect-src',
    "'self'",
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://firebase.googleapis.com',
    'https://firebaseinstallations.googleapis.com',
    'https://firestore.googleapis.com',
    apiProxyTarget ?? '',
  ]
    .filter(Boolean)
    .join(' '),
  "img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src 'self' https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
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