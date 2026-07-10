/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3는 네이티브 모듈이므로 서버 사이드에서만 실행
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
