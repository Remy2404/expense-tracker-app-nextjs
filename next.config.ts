import type { NextConfig } from 'next';

const normalizeApiProxyTarget = (target?: string) => {
  if (!target) {
    return null;
  }

  return target.replace(/\/+$/, '').replace(/\/api$/, '');
};

const apiProxyTarget = normalizeApiProxyTarget(process.env.API_PROXY_TARGET);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
