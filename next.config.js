/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'formidable', 'ibm-cos-sdk']
  },
  api: {
    responseLimit: '10mb'
  }
}

module.exports = nextConfig
