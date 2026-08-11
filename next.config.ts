import type { NextConfig } from 'next'
import { config } from 'dotenv'

config({ path: '.env.local' })

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
//           {
//           key: "Content-Security-Policy",
//           value: [
//   "default-src 'self'",
//   "script-src 'self' 'unsafe-inline'",
//   "style-src 'self' 'unsafe-inline'",
//   "img-src 'self' data: blob:",
//   "font-src 'self'",
//   "connect-src 'self'",
//   "frame-src 'self'",
//   "object-src 'none'",
//   "base-uri 'self'",
//   "frame-ancestors 'none'",
// ].join('; '),
//           },
        ],
      },
    ]
  },
}

export default nextConfig
