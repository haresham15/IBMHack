/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['pdf-parse', 'formidable', 'ibm-cos-sdk'] }
}

module.exports = nextConfig
