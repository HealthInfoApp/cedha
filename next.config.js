/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mysql2'],
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig