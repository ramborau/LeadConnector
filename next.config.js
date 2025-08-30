/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['graph.facebook.com', 'scontent.xx.fbcdn.net']
  }
}

module.exports = nextConfig