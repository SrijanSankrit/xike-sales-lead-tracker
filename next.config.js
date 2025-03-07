/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['elpritxbjvoilvbbdgbw.supabase.co', 'via.placeholder.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig