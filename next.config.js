/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply no-cache headers to every protected page and API route.
        // This prevents Vercel's CDN from serving a cached authenticated
        // response to a visitor who has no auth cookie.
        source: '/(|dashboard|api/:path*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
          { key: 'Expires',       value: '0' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
