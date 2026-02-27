/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['pdf-parse', 'formidable', 'ibm-cos-sdk'] },

  // mapbox-gl v3 bundles its own worker inline but still references browser globals.
  // Excluding it from server-side bundling prevents "window is not defined" errors.
  webpack: (config, { isServer }) => {
    if (isServer) {
      // mapbox-gl must never be bundled on the server
      config.externals = [...(config.externals || []), 'mapbox-gl']
    }
    return config
  }
}

module.exports = nextConfig
