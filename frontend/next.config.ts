import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  // 프로덕션 환경에서 API URL 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
  },
};

// Sentry 설정
const sentryWebpackPluginOptions = {
  // 조직 및 프로젝트 설정 (소스맵 업로드 시 필요)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 업로드 설정
  silent: !process.env.CI, // CI에서만 로그 출력
  widenClientFileUpload: true,

  // 빌드 옵션
  hideSourceMaps: true, // 프로덕션에서 소스맵 숨기기
  disableLogger: true,  // 빌드 로그 최소화

  // 터널링 (광고 차단기 우회)
  tunnelRoute: "/monitoring",
};

// Sentry DSN이 있을 때만 withSentryConfig 적용
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
