"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Github, ArrowRight } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();
  const redirectUrl = searchParams.get("redirect") || "/";

  // Already logged in - redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, redirectUrl]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  // Already authenticated, will redirect
  if (isAuthenticated) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">리다이렉트 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <span className="text-2xl font-bold text-white">QA</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          QA-Arena에 오신 것을 환영합니다
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          로그인하여 학습 진도를 추적하세요
        </p>
      </div>

      {/* Login Button */}
      <div className="space-y-4">
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-6 py-3
                     bg-gray-900 dark:bg-white text-white dark:text-gray-900
                     rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100
                     transition-colors font-medium"
        >
          <Github className="w-5 h-5" />
          GitHub으로 로그인
        </button>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
          비회원도 문제 풀이가 가능합니다.
          <br />
          로그인하면 <strong>진도 추적</strong>과 <strong>성장 통계</strong>를 확인할 수 있습니다.
        </p>
      </div>

      {/* Back to problems */}
      <div className="mt-6 text-center">
        <Link
          href="/problems"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400
                     hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          문제 목록으로 이동
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Suspense fallback={<LoadingFallback />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
