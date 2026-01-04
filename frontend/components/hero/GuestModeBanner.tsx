"use client";

/**
 * GuestModeBanner Component
 *
 * 메인 페이지의 로그인 유도 섹션.
 * 로그인 상태에 따라 다른 메시지와 CTA를 표시합니다.
 * - 비로그인: "로그인 없이 바로 시작" + 게스트/GitHub 로그인 버튼
 * - 로그인: "{이름}님, 환영합니다!" + 문제/학습현황 버튼
 */

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function GuestModeBanner() {
  const { isAuthenticated, user } = useAuth();

  // 로그인된 사용자에게는 환영 메시지 표시
  if (isAuthenticated) {
    return (
      <section className="section-base bg-[var(--background)]">
        <div className="section-container !max-w-xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {user?.username || "회원"}님, 환영합니다!
            </h2>
          </div>
          <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
            AI 피드백과 제출 기록 저장 기능을 모두 이용할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/problems"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              문제 풀러 가기
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              학습 현황 보기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 비로그인 사용자에게 기존 UI 표시
  return (
    <section className="section-base bg-[var(--background)]">
      <div className="section-container !max-w-xl text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg
            className="w-8 h-8 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            로그인 없이 바로 시작
          </h2>
        </div>
        <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
          게스트 모드로 즉시 문제를 풀고 채점 결과를 확인하세요.
          <br className="hidden sm:block" />
          GitHub 로그인 시 AI 피드백과 제출 기록 저장 기능이 추가됩니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/problems"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            게스트로 시작하기
          </Link>
          <Link
            href="/api/v1/auth/github/login"
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub로 로그인
          </Link>
        </div>
      </div>
    </section>
  );
}
