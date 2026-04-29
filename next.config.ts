import type { NextConfig } from 'next';

const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, '');
const isDev = process.env.NODE_ENV !== 'production';

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();

const extraConnectSources = [
  apiProxyTarget,
  firebaseAuthDomain ? `https://${firebaseAuthDomain}` : undefined,
].filter(Boolean);

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  [
    'script-src',
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
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://*.firebaseapp.com',
    ...extraConnectSources,
  ]
    .filter(Boolean)
    .join(' '),
  [
    'frame-src',
    "'self'",
    'https://accounts.google.com',
    'https://*.firebaseapp.com',
    firebaseProjectId ? `https://${firebaseProjectId}.firebaseapp.com` : '',
    firebaseAuthDomain ? `https://${firebaseAuthDomain}` : '',
  ]
    .filter(Boolean)
    .join(' '),
  [
    'img-src',
    "'self'",
    'data:',
    'blob:',
    'https://*.googleusercontent.com',
    'https://www.gstatic.com',
    'https://lh3.googleusercontent.com',
  ].join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
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