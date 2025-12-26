"use client";

import { useState, useEffect } from "react";
import { X, Monitor } from "lucide-react";

const STORAGE_KEY = "qa-arena-mobile-notice-dismissed";

interface MobileNoticeProps {
  /** 모바일/태블릿에서만 표시할지 여부 (기본: true) */
  showOnMobileOnly?: boolean;
}

export default function MobileNotice({ showOnMobileOnly = true }: MobileNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // localStorage에서 이전에 닫았는지 확인
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (isDismissed) {
      return;
    }

    // 모바일/태블릿 감지 (< 1024px)
    const checkDevice = () => {
      if (showOnMobileOnly) {
        const isMobileOrTablet = window.innerWidth < 1024;
        setIsVisible(isMobileOrTablet);
      } else {
        setIsVisible(true);
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, [showOnMobileOnly]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleDismissPermanently = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  // SSR 방지
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-lg p-4">
        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-blue-500 dark:hover:bg-blue-600 rounded-full transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 내용 */}
        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              PC에서 더 편리하게 코딩하세요
            </p>
            <p className="text-xs text-blue-100 mt-1">
              코드 작성과 디버깅은 데스크톱 환경에 최적화되어 있습니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleDismissPermanently}
            className="text-xs text-blue-200 hover:text-white transition-colors px-2 py-1"
          >
            다시 보지 않기
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs bg-blue-500 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 px-3 py-1 rounded transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
