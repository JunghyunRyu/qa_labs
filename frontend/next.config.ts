import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 프로덕션 환경에서 API URL 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
  },
};

export default nextConfig;
