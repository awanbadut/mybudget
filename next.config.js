/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ws', '@neondatabase/serverless'],
};

module.exports = nextConfig;
