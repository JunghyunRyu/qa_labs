"use client";

import { useEffect } from "react";
import { X, Filter, RotateCcw, Check, Sparkles, Star, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 타입 정의
type DifficultyFilter = "All" | "Very Easy" | "Easy" | "Medium" | "Hard";
type DomainFilter = "All" | "common" | "fintech" | "commerce" | "saas" | "platform" | "content";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // 도메인 필터
  domainFilter: DomainFilter;
  onDomainChange: (domain: DomainFilter) => void;
  // 난이도 필터
  difficultyFilter: DifficultyFilter;
  onDifficultyChange: (difficulty: DifficultyFilter) => void;
  // 기타 필터
  showNewOnly: boolean;
  onShowNewOnlyChange: (show: boolean) => void;
  showBookmarkedOnly: boolean;
  onShowBookmarkedOnlyChange: (show: boolean) => void;
  showUnsolvedOnly: boolean;
  onShowUnsolvedOnlyChange: (show: boolean) => void;
  // 인증 상태
  isAuthenticated: boolean;
  // 초기화
  onReset: () => void;
  // 활성 필터 개수
  activeFilterCount: number;
}

// 도메인 레이블 정의
const DOMAIN_OPTIONS: { value: DomainFilter; label: string }[] = [
  { value: "All", label: "전체" },
  { value: "common", label: "공통" },
  { value: "fintech", label: "핀테크" },
  { value: "commerce", label: "커머스" },
  { value: "saas", label: "SaaS" },
  { value: "platform", label: "플랫폼" },
  { value: "content", label: "컨텐츠" },
];

// 난이도 레이블 정의
const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string; color: string }[] = [
  { value: "All", label: "전체", color: "bg-slate-500" },
  { value: "Very Easy", label: "입문", color: "bg-sky-500" },
  { value: "Easy", label: "쉬움", color: "bg-emerald-500" },
  { value: "Medium", label: "보통", color: "bg-amber-500" },
  { value: "Hard", label: "어려움", color: "bg-rose-500" },
];

export default function MobileFilterSheet({
  isOpen,
  onClose,
  domainFilter,
  onDomainChange,
  difficultyFilter,
  onDifficultyChange,
  showNewOnly,
  onShowNewOnlyChange,
  showBookmarkedOnly,
  onShowBookmarkedOnlyChange,
  showUnsolvedOnly,
  onShowUnsolvedOnlyChange,
  isAuthenticated,
  onReset,
  activeFilterCount,
}: MobileFilterSheetProps) {
  // Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* 핸들 바 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">필터</h2>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 도메인 필터 */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">도메인</h3>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDomainChange(option.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        domainFilter === option.value
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {domainFilter === option.value && <Check className="w-4 h-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 난이도 필터 */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">난이도</h3>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDifficultyChange(option.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        difficultyFilter === option.value
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {option.value !== "All" && (
                        <span className={`w-2 h-2 rounded-full ${option.color}`} />
                      )}
                      {difficultyFilter === option.value && <Check className="w-4 h-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기타 필터 */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">기타</h3>
                <div className="space-y-2">
                  {/* NEW 필터 */}
                  <button
                    onClick={() => onShowNewOnlyChange(!showNewOnly)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                      showNewOnly
                        ? "bg-sky-600/20 text-sky-400 border border-sky-500/50"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4" />
                      <span>NEW 문제만</span>
                    </div>
                    {showNewOnly && <Check className="w-4 h-4" />}
                  </button>

                  {/* 북마크 필터 - 로그인 사용자만 */}
                  {isAuthenticated && (
                    <button
                      onClick={() => onShowBookmarkedOnlyChange(!showBookmarkedOnly)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        showBookmarkedOnly
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Star className={`w-4 h-4 ${showBookmarkedOnly ? "fill-yellow-400" : ""}`} />
                        <span>북마크한 문제만</span>
                      </div>
                      {showBookmarkedOnly && <Check className="w-4 h-4" />}
                    </button>
                  )}

                  {/* 안 푼 문제만 필터 - 로그인 사용자만 */}
                  {isAuthenticated && (
                    <button
                      onClick={() => onShowUnsolvedOnlyChange(!showUnsolvedOnly)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        showUnsolvedOnly
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <EyeOff className="w-4 h-4" />
                        <span>안 푼 문제만</span>
                      </div>
                      {showUnsolvedOnly && <Check className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="flex gap-3 p-5 border-t border-slate-800 bg-slate-900">
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium transition-colors hover:bg-slate-700 min-h-[48px]"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium transition-colors hover:bg-indigo-500 min-h-[48px]"
              >
                적용하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 필터 버튼 컴포넌트 (문제 목록에서 사용)
export function MobileFilterButton({
  onClick,
  activeCount,
}: {
  onClick: () => void;
  activeCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium transition-colors hover:bg-slate-700 min-h-[44px]"
    >
      <Filter className="w-4 h-4" />
      <span>필터</span>
      {activeCount > 0 && (
        <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  );
}
