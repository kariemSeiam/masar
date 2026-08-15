import type { NextConfig } from "next";
import path from "node:path";

// Loader path from orchids-visual-edits - use direct resolve to get the actual file
const loaderPath = require.resolve('orchids-visual-edits/loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Turbopack configuration - disabled for static export compatibility
  // turbopack: {
  //   rules: {
  //     "*.{jsx,tsx}": {
  //       loaders: [loaderPath]
  //     }
  //   }
  // },
  // GitHub Pages serves this repo under /masar; a custom domain (masar.kariem.dev)
  // serves it at root — DEPLOY_TARGET=custom-domain switches basePath off for that build.
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' && process.env.DEPLOY_TARGET !== 'custom-domain' ? '/masar' : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.DEPLOY_TARGET !== 'custom-domain' ? '/masar' : '',
  trailingSlash: true,
} as NextConfig;

export default nextConfig;
