//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/ai/:path*',
        destination: (process.env.AI_GATEWAY_URL || 'http://127.0.0.1:3010/api/v1/ai') + '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
