/** Problems list page - Mission Control Center */

"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isTutorialCompleted, syncTutorialStatus } from "@/lib/tutorialData";
import { useTutorialStore } from "@/stores/tutorialStore";
import { TutorialWelcomeModal, TutorialFullScreen } from "@/components/tutorial";
import { getProblems, GetProblemsParams, getNextScheduledProblem, NextScheduledProblem } from "@/lib/api/problems";
import { ApiError } from "@/lib/api";
import type { ProblemListResponse, ProblemListItem } from "@/types/problem";
import ProblemCard from "@/components/ProblemCard";
import ComingSoonBanner from "@/components/ComingSoonBanner";
import SampleProblemsBanner from "@/components/SampleProblemsBanner";
import UserStatsBar from "@/components/problems/UserStatsBar";
import DailyBountyBanner from "@/components/DailyBountyBanner";
import { ProblemCardSkeletonGrid } from "@/components/ProblemCardSkeleton";
import PyodidePreloader from "@/components/PyodidePreloader";
import Link from "next/link";
import { Search, X, ChevronDown, Tag, ArrowUpDown, Sparkles, Package, Star, Rocket, PartyPopper, Bookmark, LogIn } from "lucide-react";
import { toTagViewModels, type TagViewModel } from "@/lib/tagDefinitions";
import { useAuth } from "@/lib/auth/AuthContext";

type DifficultyFilter = "All" | "Very Easy" | "Easy" | "Medium" | "Hard";
type DomainFilter = "All" | "common" | "fintech" | "commerce" | "saas" | "platform" | "content";
type SortOption = "recommended" | "newest" | "difficulty-asc" | "difficulty-desc" | "success-rate-desc" | "success-rate-asc";

// 도메인 레이블 정의
const DOMAIN_LABELS: Record<DomainFilter, string> = {
  All: "전체",
  common: "공통",
  fintech: "핀테크",
  commerce: "커머스",
  saas: "SaaS",
  platform: "플랫폼",
  content: "컨텐츠",
};

// 난이도 레이블 정의
const DIFFICULTY_LABELS: Record<DifficultyFilter, string> = {
  All: "전체",
  "Very Easy": "입문",
  Easy: "쉬움",
  Medium: "보통",
  Hard: "어려움",
};

// Mission Control 스타일 난이도 Pill 색상
const DIFFICULTY_PILL_COLORS: Record<DifficultyFilter, { active: string; inactive: string; dot: string }> = {
  All: {
    active: "bg-slate-600 text-white",
    inactive: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300",
    dot: "bg-slate-400",
  },
  "Very Easy": {
    active: "bg-sky-600 text-white",
    inactive: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300",
    dot: "bg-sky-400",
  },
  Easy: {
    active: "bg-emerald-600 text-white",
    inactive: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300",
    dot: "bg-emerald-400",
  },
  Medium: {
    active: "bg-amber-600 text-white",
    inactive: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300",
    dot: "bg-amber-400",
  },
  Hard: {
    active: "bg-rose-600 text-white",
    inactive: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300",
    dot: "bg-rose-400",
  },
};

// 도메인 Chip 색상
const DOMAIN_CHIP_COLORS: Record<DomainFilter, { active: string; inactive: string }> = {
  All: {
    active: "bg-indigo-600 text-white border-indigo-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  common: {
    active: "bg-slate-600 text-white border-slate-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  fintech: {
    active: "bg-emerald-600 text-white border-emerald-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  commerce: {
    active: "bg-amber-600 text-white border-amber-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  saas: {
    active: "bg-blue-600 text-white border-blue-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  platform: {
    active: "bg-purple-600 text-white border-purple-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
  content: {
    active: "bg-rose-600 text-white border-rose-500",
    inactive: "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300",
  },
};

// useSearchParams를 사용하는 내부 컴포넌트
function ProblemsContent() {
  const router = useRouter();
  const { isAuthenticated, user, login } = useAuth();
  const searchParams = useSearchParams();

  // 로그인 사용자의 튜토리얼 완료 상태 동기화
  useEffect(() => {
    if (user?.tutorial_completed_at) {
      syncTutorialStatus(user.tutorial_completed_at);
    }
  }, [user?.tutorial_completed_at]);

  // Tutorial store
  const {
    showModal,
    showTutorial,
    openModal,
    closeModal,
    startTutorial,
    closeTutorial,
    completeTutorial,
  } = useTutorialStore();

  // 튜토리얼 미완료 시 0.5초 후 환영 모달 표시
  useEffect(() => {
    if (!isTutorialCompleted()) {
      const timer = setTimeout(() => {
        openModal();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [openModal]);

  const [data, setData] = useState<ProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // 필터 및 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("Easy"); // 기본값: Easy (Very Easy 숨김)
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("recommended"); // 기본값: 추천순
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [nextScheduled, setNextScheduled] = useState<NextScheduledProblem | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showBookmarkLoginPrompt, setShowBookmarkLoginPrompt] = useState(false);

  // URL 쿼리 파라미터에서 필터 읽기
  useEffect(() => {
    const domainParam = searchParams.get("domain");
    if (domainParam && Object.keys(DOMAIN_LABELS).includes(domainParam)) {
      setDomainFilter(domainParam as DomainFilter);
    }
    // 북마크 필터 - 로그인 사용자만 적용
    const bookmarkedParam = searchParams.get("bookmarked");
    if (bookmarkedParam === "true") {
      if (isAuthenticated) {
        setShowBookmarkedOnly(true);
        setShowBookmarkLoginPrompt(false);
      } else {
        // 비로그인 사용자는 로그인 유도 배너 표시
        setShowBookmarkLoginPrompt(true);
        setShowBookmarkedOnly(false);
      }
    }
    // 신규 가입자 웰컴 배너
    const welcomeParam = searchParams.get("welcome");
    if (welcomeParam === "true") {
      setShowWelcomeBanner(true);
      // URL에서 welcome 파라미터 제거 (새로고침 시 다시 안 뜨게)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("welcome");
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, router, isAuthenticated]);

  // Fetch next scheduled problem for Coming Soon card
  useEffect(() => {
    async function fetchNextScheduled() {
      try {
        const result = await getNextScheduledProblem();
        setNextScheduled(result);
      } catch {
        setNextScheduled(null);
      }
    }
    fetchNextScheduled();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: GetProblemsParams = {
        page,
        pageSize,
        difficulty: difficultyFilter !== "All" ? difficultyFilter : undefined,
        domain: domainFilter !== "All" ? domainFilter : undefined,
        search: debouncedSearchQuery.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortOption,
        bookmarked: showBookmarkedOnly || undefined,
      };
      const result = await getProblems(params);
      setData(result);
    } catch (err: unknown) {
      let errorMessage = "문제 목록을 불러오는데 실패했습니다.";
      if (err instanceof ApiError) {
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, difficultyFilter, domainFilter, debouncedSearchQuery, selectedTags, sortOption, showBookmarkedOnly]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setPage(1);
  }, [difficultyFilter, domainFilter, selectedTags, debouncedSearchQuery, sortOption]);

  // NEW 문제 판별 함수 (7일 이내 공개)
  const isNewProblem = useCallback((publishedAt: string | null | undefined): boolean => {
    if (!publishedAt) return false;
    const publishDate = new Date(publishedAt);
    const now = new Date();
    const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }, []);

  // 서버에서 정렬된 문제 목록 (정렬은 서버에서 처리, NEW 필터는 클라이언트에서)
  const sortedProblems = useMemo(() => {
    if (!data) return [];
    if (showNewOnly) {
      return data.problems.filter((p) => isNewProblem(p.published_at));
    }
    return data.problems;
  }, [data, showNewOnly, isNewProblem]);

  // 사용 가능한 모든 태그 추출
  const availableTags = useMemo((): TagViewModel[] => {
    if (!data) return [];
    const tagSet = new Set<string>();
    data.problems.forEach((problem) => {
      problem.skills?.forEach((skill) => tagSet.add(skill));
    });
    const allSlugs = Array.from(tagSet);
    return toTagViewModels(allSlugs);
  }, [data]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("Easy"); // 기본값: Easy
    setDomainFilter("All");
    setSelectedTags([]);
    setSortOption("recommended"); // 기본값: 추천
    setShowNewOnly(false);
    setShowBookmarkedOnly(false);
  };

  // 기본값(Easy, recommended)과 다른 필터가 적용되었는지 확인
  const hasActiveFilters = debouncedSearchQuery ||
    (difficultyFilter !== "Easy" && difficultyFilter !== "All") ||
    domainFilter !== "All" ||
    selectedTags.length > 0 ||
    showNewOnly ||
    showBookmarkedOnly ||
    (sortOption !== "recommended" && sortOption !== "difficulty-asc");

  // ============================
  // 로딩 상태 (Mission Control 다크 스켈레톤)
  // ============================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* 헤더 Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-72 bg-slate-800/50 rounded animate-pulse" />
          </div>
          {/* Stats Bar Skeleton */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-6 py-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="h-6 w-24 bg-slate-800 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="h-6 w-20 bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-28 bg-slate-800 rounded-lg" />
            </div>
          </div>
          {/* Control Bar Skeleton */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="h-12 flex-1 bg-slate-800 rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-16 bg-slate-800 rounded-full" />
                ))}
              </div>
            </div>
          </div>
          {/* Card Grid Skeleton */}
          <ProblemCardSkeletonGrid count={12} />
        </div>

        {/* Tutorial Modals */}
        {showModal && <TutorialWelcomeModal onStart={startTutorial} onSkip={closeModal} />}
        {showTutorial && <TutorialFullScreen onClose={closeTutorial} onComplete={completeTutorial} />}
      </div>
    );
  }

  // ============================
  // 에러 상태
  // ============================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
              <X className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">오류가 발생했습니다</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={fetchProblems}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
        {showModal && <TutorialWelcomeModal onStart={startTutorial} onSkip={closeModal} />}
        {showTutorial && <TutorialFullScreen onClose={closeTutorial} onComplete={completeTutorial} />}
      </div>
    );
  }

  if (!data) return null;

  // ============================
  // 메인 렌더링
  // ============================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Mission Control
              </h1>
              <p className="text-slate-400 text-sm">
                {hasActiveFilters
                  ? `필터링 결과: ${data.total}개의 미션`
                  : `${data.total}개의 버그 탐지 미션이 당신을 기다립니다`}
              </p>
            </div>
          </div>
        </div>

        {/* 신규 가입자 웰컴 배너 */}
        {showWelcomeBanner && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <PartyPopper className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    환영합니다! QA Arena에 오신 것을 축하해요 🎉
                  </h3>
                  <p className="text-slate-300 text-sm">
                    버그 탐지 미션을 통해 테스트 코드 실력을 키워보세요.
                    <span className="text-indigo-400 font-medium"> 입문 난이도</span>부터 시작하는 걸 추천드려요!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/problems/problem-ve01"
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Rocket className="w-4 h-4" />
                  첫 미션 시작
                </Link>
                <button
                  onClick={() => setShowWelcomeBanner(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 비로그인 사용자 북마크 접근 시 로그인 유도 배너 */}
        {showBookmarkLoginPrompt && (
          <div className="mb-6 bg-gradient-to-r from-amber-600/20 via-yellow-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Bookmark className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    북마크 기능을 사용하려면 로그인이 필요해요
                  </h3>
                  <p className="text-slate-300 text-sm">
                    로그인하면 관심 있는 문제를 북마크하고, 나중에 빠르게 찾아볼 수 있어요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => login("github")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  로그인하기
                </button>
                <button
                  onClick={() => setShowBookmarkLoginPrompt(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Stats Bar */}
        <UserStatsBar totalProblems={data.total} />

        {/* Daily Bounty Banner - 오늘의 미션 */}
        <DailyBountyBanner />

        {/* ============================================
            Sticky Control Bar (검색 + 필터) - 2줄 압축 레이아웃
            ============================================ */}
        <div className="sticky top-14 z-30 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 mb-6 transition-all">

          {/* Row 1: 검색창 + 정렬 드롭다운 */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="검색할 버그 유형을 입력하세요 (예: 할인 계산, 경계값)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-20 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                aria-label="문제 검색"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded hidden sm:block">
                Ctrl+K
              </span>
            </div>
            {/* 정렬 드롭다운 - 데스크탑에서만 Row 1에 표시 */}
            <div className="relative hidden lg:block">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none h-full pl-9 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all shadow-lg"
              >
                <option value="recommended">추천</option>
                <option value="newest">최신</option>
                <option value="difficulty-asc">난이도 낮음</option>
                <option value="difficulty-desc">난이도 높음</option>
                <option value="success-rate-desc">정답률 높음</option>
                <option value="success-rate-asc">정답률 낮음</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: 도메인 + 난이도 + 기타 필터 (한 줄에 모두) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 도메인 Chips */}
            <span className="text-xs text-slate-500 shrink-0 hidden sm:inline">도메인:</span>
            {(Object.keys(DOMAIN_LABELS) as DomainFilter[]).map((domain) => (
              <button
                key={domain}
                onClick={() => setDomainFilter(domain)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border shrink-0 ${
                  domainFilter === domain
                    ? DOMAIN_CHIP_COLORS[domain].active
                    : DOMAIN_CHIP_COLORS[domain].inactive
                }`}
              >
                {DOMAIN_LABELS[domain]}
              </button>
            ))}

            <span className="w-px h-5 bg-slate-700 hidden sm:block" />

            {/* 난이도 Pills (컴팩트 버전) */}
            {(["All", "Very Easy", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  difficultyFilter === diff
                    ? DIFFICULTY_PILL_COLORS[diff].active
                    : DIFFICULTY_PILL_COLORS[diff].inactive
                }`}
              >
                {diff !== "All" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_PILL_COLORS[diff].dot}`} />
                )}
                {DIFFICULTY_LABELS[diff]}
              </button>
            ))}

            <span className="w-px h-5 bg-slate-700 hidden sm:block" />

            {/* NEW 필터 */}
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                showNewOnly
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-sky-400 hover:bg-sky-900/50"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              NEW
            </button>

            {/* 북마크 필터 - 로그인 사용자만 */}
            {isAuthenticated && (
              <button
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  showBookmarkedOnly
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
              >
                <Star className={`w-3 h-3 ${showBookmarkedOnly ? "fill-yellow-400" : ""}`} />
                북마크
              </button>
            )}

            {/* 태그 필터 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                showFilters || selectedTags.length > 0
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              태그
              {selectedTags.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* 정렬 드롭다운 - 모바일/태블릿에서 Row 2에 표시 */}
            <div className="relative lg:hidden shrink-0">
              <ArrowUpDown className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="recommended">추천</option>
                <option value="newest">최신</option>
                <option value="difficulty-asc">난이도↑</option>
                <option value="difficulty-desc">난이도↓</option>
                <option value="success-rate-desc">정답률↑</option>
                <option value="success-rate-asc">정답률↓</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Reset 버튼 */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all shrink-0 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                초기화
              </button>
            )}
          </div>

          {/* 태그 필터 패널 (확장 시) */}
          {showFilters && availableTags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => handleTagToggle(tag.slug)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedTags.includes(tag.slug)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                    }`}
                  >
                    {tag.labelKo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 px-1">
            {showNewOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                NEW
                <button onClick={() => setShowNewOnly(false)} className="ml-1 hover:text-sky-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {showBookmarkedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                <Star className="w-3 h-3 fill-yellow-400" />
                북마크
                <button onClick={() => setShowBookmarkedOnly(false)} className="ml-1 hover:text-yellow-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {difficultyFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium">
                {DIFFICULTY_LABELS[difficultyFilter]}
                <button onClick={() => setDifficultyFilter("All")} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {domainFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium">
                {DOMAIN_LABELS[domainFilter]}
                <button onClick={() => setDomainFilter("All")} className="ml-1 hover:text-indigo-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTags.map((tagSlug) => {
              const tagModel = availableTags.find((t) => t.slug === tagSlug);
              return (
                <span
                  key={tagSlug}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium"
                >
                  {tagModel?.labelKo || tagSlug}
                  <button onClick={() => handleTagToggle(tagSlug)} className="ml-1 hover:text-indigo-300">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {debouncedSearchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium">
                &quot;{debouncedSearchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-300 underline ml-2"
            >
              모두 지우기
            </button>
          </div>
        )}

        {/* Tutorial Banner (온보딩 섹션) - 1문제 이상 푼 사용자에게는 숨김 */}
        <SampleProblemsBanner forceHide={(user?.solved_count || 0) > 0} />

        {/* Coming Soon Banner */}
        {nextScheduled && <ComingSoonBanner nextProblem={nextScheduled} />}

        {/* ============================================
            문제 카드 그리드 or 빈 상태
            ============================================ */}
        {sortedProblems.length === 0 ? (
          // Empty State
          showBookmarkedOnly ? (
            // 북마크 전용 빈 상태
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-amber-500/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                아직 북마크한 문제가 없어요
              </h3>
              <p className="text-slate-400 mb-6">
                관심 있는 문제를 북마크하면 여기서 빠르게 찾아볼 수 있어요.
              </p>
              <button
                onClick={() => setShowBookmarkedOnly(false)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
              >
                전체 문제 보기
              </button>
            </div>
          ) : (
            // 일반 빈 상태
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                이런, 버그가 완벽하게 숨었네요
              </h3>
              <p className="text-slate-400 mb-6">
                {hasActiveFilters
                  ? "다른 키워드나 필터로 검색해보세요."
                  : "등록된 문제가 없습니다."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  필터 초기화
                </button>
              )}
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
              {sortedProblems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <nav aria-label="페이지 네비게이션" className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-slate-400 text-sm">
                  {page} / {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  다음
                </button>
              </nav>
            )}
          </>
        )}

        {/* 홈으로 돌아가기 링크 */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>

        {/* Pyodide 사전 로딩 */}
        <PyodidePreloader initializeImmediately={true} delay={2000} />

        {/* Tutorial Modals */}
        {showModal && <TutorialWelcomeModal onStart={startTutorial} onSkip={closeModal} />}
        {showTutorial && <TutorialFullScreen onClose={closeTutorial} onComplete={completeTutorial} />}
      </div>
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">미션 로딩 중...</p>
          </div>
        </div>
      }
    >
      <ProblemsContent />
    </Suspense>
  );
}
