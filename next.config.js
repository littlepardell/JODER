/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  // Asegurarse de que las imágenes de Supabase están permitidas
  images: {
    domains: ['ufmnmoevyemfujscxent.supabase.co'],
  },
}

module.exports = nextConfig
