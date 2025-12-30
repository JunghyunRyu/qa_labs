// Google Analytics gtag.js 타입 선언
interface Window {
  gtag: (
    command: "config" | "event" | "js" | "set",
    targetId: string | Date,
    config?: Record<string, unknown>
  ) => void;
  dataLayer: unknown[];
}
