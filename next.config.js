/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['pdf-parse', 'formidable'] }
}

module.exports = nextConfig
