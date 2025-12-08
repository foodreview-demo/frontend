/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // 동적 라우트는 클라이언트에서 처리
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/explore': { page: '/explore' },
      '/write': { page: '/write' },
      '/ranking': { page: '/ranking' },
      '/profile': { page: '/profile' },
      '/chat': { page: '/chat' },
      '/login': { page: '/login' },
      '/signup': { page: '/signup' },
      '/settings': { page: '/settings' },
      '/settings/profile': { page: '/settings/profile' },
      '/settings/privacy': { page: '/settings/privacy' },
    }
  },
}

export default nextConfig
