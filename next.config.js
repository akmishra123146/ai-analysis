/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next_dev',
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
};

module.exports = nextConfig;
