import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const allowUnsafeEval = isDev || isTruthy(process.env.CSP_ALLOW_UNSAFE_EVAL);

const normalizeOrigin = (rawValue: string | undefined): string | undefined => {
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^(https?|wss?):\/\/\*\.[^/*\s]+(?::\d+)?$/i.test(trimmed)) {
    return trimmed;
  }

  const explicitOriginMatch = /^(https?|wss?):\/\/[^/*\s]+(?::\d+)?$/i;
  if (explicitOriginMatch.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
      return undefined;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
};

const parseCsvOrigins = (rawValue: string | undefined): string[] =>
  (rawValue ?? '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter((entry): entry is string => Boolean(entry));

const unique = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const toSocketVariants = (origin: string | undefined): string[] => {
  if (!origin) {
    return [];
  }

  if (origin.startsWith('http://')) {
    return [origin, `ws://${origin.slice('http://'.length)}`];
  }

  if (origin.startsWith('https://')) {
    return [origin, `wss://${origin.slice('https://'.length)}`];
  }

  if (origin.startsWith('ws://')) {
    return [origin, `http://${origin.slice('ws://'.length)}`];
  }

  if (origin.startsWith('wss://')) {
    return [origin, `https://${origin.slice('wss://'.length)}`];
  }

  return [origin];
};

const buildConnectSources = () => {
  const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const extraOrigins = parseCsvOrigins(process.env.NEXT_PUBLIC_CSP_CONNECT_SRC_EXTRA);
  const configuredSocketOrigins = unique([
    normalizeOrigin(process.env.NEXT_PUBLIC_REALTIME_SOCKET_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_REALTIME_RELAY_URL),
    normalizeOrigin(process.env.REALTIME_PUBLIC_SOCKET_URL),
    normalizeOrigin(process.env.REALTIME_RELAY_URL),
  ]);

  const relayPort = Number(process.env.RELAY_PORT || 8090);
  const localhostSocketOrigins =
    isDev && Number.isFinite(relayPort) && relayPort > 0
      ? [
          `http://localhost:${relayPort}`,
          `http://127.0.0.1:${relayPort}`,
        ]
      : [];

  const apiOrigins = [
    normalizeOrigin(process.env.NEXT_PUBLIC_API_BASE_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_AI_API_URL),
    normalizeOrigin(process.env.API_PROXY_TARGET),
    normalizeOrigin(process.env.RELAY_ALLOWED_ORIGIN),
    firebaseAuthDomain ? normalizeOrigin(`https://${firebaseAuthDomain}`) : undefined,
  ];

  return unique([
    ...apiOrigins,
    ...extraOrigins,
    ...configuredSocketOrigins.flatMap((origin) => toSocketVariants(origin)),
    ...localhostSocketOrigins.flatMap((origin) => toSocketVariants(origin)),
  ]);
};

const buildFrameSources = () => {
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();

  return [
    "'self'",
    'https://accounts.google.com',
    'https://*.firebaseapp.com',
    firebaseProjectId ? normalizeOrigin(`https://${firebaseProjectId}.firebaseapp.com`) : undefined,
    firebaseAuthDomain ? normalizeOrigin(`https://${firebaseAuthDomain}`) : undefined,
  ].filter(Boolean);
};

const buildImageSources = () => {
  return unique([
    'https://ik.imagekit.io',
    normalizeOrigin(process.env.IMAGEKIT_URL_ENDPOINT),
    normalizeOrigin(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT),
  ]);
};

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
    allowUnsafeEval ? "'unsafe-eval'" : '',
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
    ...buildConnectSources(),
  ]
    .filter(Boolean)
    .join(' '),
  ['frame-src', ...buildFrameSources()].join(' '),
  [
    'img-src',
    "'self'",
    'data:',
    'blob:',
    'https://*.googleusercontent.com',
    'https://www.gstatic.com',
    'https://lh3.googleusercontent.com',
    ...buildImageSources(),
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
    const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, '');
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
