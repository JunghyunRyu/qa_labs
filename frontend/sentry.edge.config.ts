// Edge runtime Sentry configuration
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 설정
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",

    // 성능 모니터링
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
