/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ninjapay/types', '@ninjapay/logger'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
