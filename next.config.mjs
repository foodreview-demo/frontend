/** @type {import('next').NextConfig} */
const nextConfig = {
  // 프로덕션 빌드 시에만 export 모드 사용
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
