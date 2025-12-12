// Client-side Sentry configuration
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 설정
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",

    // 성능 모니터링
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // 세션 리플레이 (에러 발생 시 100%, 일반 세션 10%)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // 추가 설정
    debug: process.env.NODE_ENV === "development",

    // 민감한 데이터 필터링
    beforeSend(event) {
      // 특정 에러 무시 (예: 네트워크 에러, 청크 로딩 에러)
      if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
        return null;
      }

      return event;
    },

    integrations: [
      Sentry.replayIntegration({
        // 마스킹 설정
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    // 무시할 에러 패턴
    ignoreErrors: [
      // 브라우저 확장 프로그램 에러
      "top.GLOBALS",
      // 사용자 취소
      "AbortError",
      // 네트워크 에러
      "Failed to fetch",
      "NetworkError",
      // 청크 로딩 에러
      "ChunkLoadError",
      "Loading chunk",
    ],

    // 무시할 URL 패턴
    denyUrls: [
      // 브라우저 확장 프로그램
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}
