/**
 * Security headers for every response. The CSP is limited to directives that cannot break Next.js inline scripts,
 * the AI SDK stream or the Auth.js / Google OAuth redirects: framing, <base> and plugins. HSTS is already sent by Vercel.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Every route uses a static `metadata` object (no `generateMetadata`), so resolving it before the first byte costs
   * nothing. Matching all user agents keeps <title>/<meta> in <head> on dynamic pages (/ingresar, /registro) instead of
   * streaming them into <body>, which crawlers and Lighthouse do not read as document metadata.
   */
  htmlLimitedBots: /.*/,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
