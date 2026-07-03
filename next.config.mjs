/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Public Supabase keys embedded — safe to commit (anon key has RLS protection)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://rfgrjujihbombbfyiqgj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_o-6BeASaOQ6z0lbHkPcWMA_jS4pR7iE',
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
