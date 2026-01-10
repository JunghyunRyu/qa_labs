/**
 * GuestConversionBanner component
 * 비회원 코드 휘발성 경고 배너 (손실 회피 심리 활용)
 *
 * 특징:
 * - amber 색상으로 주의 환기
 * - 개발자에게 익숙한 "저장되지 않음" 패턴
 * - sessionStorage로 닫기 상태 저장
 */

"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Github, CloudUpload } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useGuestConversion } from "./useGuestConversion";

interface GuestConversionBannerProps {
  /** 코드가 변경되었는지 여부 */
  hasCodeChanged: boolean;
  /** 현재 문제 ID */
  problemId?: string;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const STORAGE_KEY = "qa_guest_banner_dismissed";

export default function GuestConversionBanner({
  hasCodeChanged,
  problemId,
  onDismiss,
  className = "",
}: GuestConversionBannerProps) {
  const { isAuthenticated } = useAuth();
  const { setPendingMerge } = useGuestConversion();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR 방어: sessionStorage 체크
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      setIsDismissed(dismissed === "true");
    } catch (error) {
      console.warn("[GuestConversionBanner] Failed to read sessionStorage:", error);
    }

    setIsHydrated(true);
  }, []);

  // 표시 조건: 비회원 + 코드 변경됨 + 닫지 않음 + 하이드레이션 완료
  const shouldShow = isHydrated && !isAuthenticated && hasCodeChanged && !isDismissed;

  if (!shouldShow) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.warn("[GuestConversionBanner] Failed to write sessionStorage:", error);
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleLogin = () => {
    // OAuth 리다이렉트 전에 pending_merge 플래그 설정
    setPendingMerge(true);

    // GitHub 로그인으로 이동
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    window.location.href = `${apiBaseUrl}/v1/auth/github/login`;
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border border-amber-300 dark:border-amber-700/50
        bg-amber-50 dark:bg-amber-950/30
        p-4
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* 경고 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>

        {/* 메시지 */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            작성 중인 코드는 저장되지 않습니다
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200/80">
            브라우저를 닫으면 코드가 사라집니다.
            계정을 연결하여 영구히 보존하세요.
          </p>

          {/* CTA 버튼 */}
          <button
            onClick={handleLogin}
            className="
              mt-3 inline-flex items-center gap-2 px-4 py-2
              bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600
              text-white text-sm font-medium rounded-lg
              transition-colors
            "
          >
            <CloudUpload className="w-4 h-4" />
            코드 동기화하기
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
}
