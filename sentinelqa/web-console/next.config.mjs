import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compiler à côté de .next quand un serveur de développement est déjà ouvert.
  distDir: process.env.HSENTINEL_BUILD_DIR || '.next',
  turbopack: { root },
  outputFileTracingRoot: root,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
