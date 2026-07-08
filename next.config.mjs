import { withBotId } from 'botid/next/config';

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Non-breaking CSP: blocks framing/plugins/base-uri injection without
  // restricting scripts/styles (the app + legacy pages use inline styles/scripts).
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withBotId(nextConfig);
