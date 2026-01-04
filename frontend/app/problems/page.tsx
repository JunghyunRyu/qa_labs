/** Problems list page */

"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProblems, GetProblemsParams, getNextScheduledProblem, NextScheduledProblem } from "@/lib/api/problems";
import { ApiError } from "@/lib/api";
import type { ProblemListResponse, ProblemListItem } from "@/types/problem";
import ProblemCard from "@/components/ProblemCard";
import ComingSoonBanner from "@/components/ComingSoonBanner";
import ProblemStatsRow from "@/components/ProblemStatsRow";
import { ProblemCardSkeletonGrid } from "@/components/ProblemCardSkeleton";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import PyodidePreloader from "@/components/PyodidePreloader";
import Link from "next/link";
import { Search, Filter, X, Bookmark, ChevronDown, Tag, Globe, ArrowUpDown, Sparkles } from "lucide-react";
import { toTagViewModels, type TagViewModel } from "@/lib/tagDefinitions";
import { useAuth } from "@/lib/auth/AuthContext";

type DifficultyFilter = "All" | "Very Easy" | "Easy" | "Medium" | "Hard";
type DomainFilter = "All" | "common" | "fintech" | "commerce" | "saas" | "platform" | "content";
type SortOption = "difficulty-asc" | "difficulty-desc" | "success-rate-desc" | "success-rate-asc";

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
  "Very Easy": "아주쉬움",
  Easy: "쉬움",
  Medium: "보통",
  Hard: "어려움",
};

// 난이도 Pill 버튼 색상 (선택/비선택) - Linear 스타일: 톤다운
const DIFFICULTY_PILL_COLORS: Record<DifficultyFilter, { active: string; inactive: string }> = {
  All: {
    active: "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
    inactive: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
  },
  "Very Easy": {
    active: "bg-blue-600 text-white dark:bg-blue-500",
    inactive: "bg-blue-50/80 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/50",
  },
  Easy: {
    active: "bg-emerald-600 text-white dark:bg-emerald-500",
    inactive: "bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
  },
  Medium: {
    active: "bg-amber-600 text-white dark:bg-amber-500",
    inactive: "bg-amber-50/80 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/50",
  },
  Hard: {
    active: "bg-red-600 text-white dark:bg-red-500",
    inactive: "bg-red-50/80 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/50",
  },
};

// 정렬 옵션 레이블
const SORT_LABELS: Record<SortOption, string> = {
  "difficulty-asc": "난이도 낮은순",
  "difficulty-desc": "난이도 높은순",
  "success-rate-desc": "정답률 높은순",
  "success-rate-asc": "정답률 낮은순",
};

// useSearchParams를 사용하는 내부 컴포넌트
function ProblemsContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 필터 및 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("difficulty-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [nextScheduled, setNextScheduled] = useState<NextScheduledProblem | null>(null);

  // URL 쿼리 파라미터에서 도메인 필터 읽기 (메인 페이지에서 도메인 클릭 시)
  useEffect(() => {
    const domainParam = searchParams.get("domain");
    if (domainParam && Object.keys(DOMAIN_LABELS).includes(domainParam)) {
      setDomainFilter(domainParam as DomainFilter);
      setShowFilters(true);  // 필터 패널 자동 열기
    }
  }, [searchParams]);

  // Fetch next scheduled problem for Coming Soon card
  useEffect(() => {
    async function fetchNextScheduled() {
      try {
        const result = await getNextScheduledProblem();
        setNextScheduled(result);
      } catch {
        // Silently fail - Coming Soon card is optional
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
  }, [page, pageSize, difficultyFilter, domainFilter, debouncedSearchQuery, selectedTags, sortOption]);

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

  // 사용 가능한 모든 태그 추출 (난이도 태그 제외, 한글화 적용)
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
    setDifficultyFilter("All");
    setDomainFilter("All");
    setSelectedTags([]);
    setSortOption("difficulty-asc");
    setShowNewOnly(false);
  };

  const hasActiveFilters = debouncedSearchQuery || difficultyFilter !== "All" || domainFilter !== "All" || selectedTags.length > 0 || showNewOnly;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        {/* Control Bar Skeleton */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 mb-4 animate-pulse">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="h-10 flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-10 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-10 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            </div>
          </div>
        </div>
        {/* Card Grid Skeleton */}
        <ProblemCardSkeletonGrid count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} onRetry={fetchProblems} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">문제 목록</h1>
            {hasActiveFilters ? (
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                필터링 결과: {data.total}개
              </p>
            ) : (
              <ProblemStatsRow />
            )}
          </div>
          {isAuthenticated && (
            <Link
              href="/problems/bookmarked"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors text-sm font-medium"
            >
              <Bookmark className="w-4 h-4" />
              북마크한 문제
            </Link>
          )}
        </div>
      </div>

      {/* 컨트롤 바 - 검색 + 빠른 필터 + 정렬 */}
      <div className="sticky top-14 z-30 bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 mb-4 transition-colors">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 검색창 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-5 h-5" />
            <input
              type="text"
              placeholder="문제 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm"
              aria-label="문제 검색"
            />
          </div>

          {/* NEW 필터 + 난이도 Pill 버튼 */}
          <div className="flex items-center gap-1" role="group" aria-label="필터">
            {/* NEW 필터 버튼 - Linear 스타일: 톤다운된 purple */}
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                showNewOnly
                  ? "bg-purple-600 dark:bg-purple-700 text-white"
                  : "bg-purple-50/80 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
              }`}
              aria-pressed={showNewOnly}
            >
              <Sparkles className="w-3 h-3" />
              NEW
            </button>
            <span className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />
            {/* 난이도 필터 버튼 */}
            {(["All", "Very Easy", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  difficultyFilter === diff
                    ? DIFFICULTY_PILL_COLORS[diff].active
                    : DIFFICULTY_PILL_COLORS[diff].inactive
                }`}
                aria-pressed={difficultyFilter === diff}
              >
                {DIFFICULTY_LABELS[diff]}
              </button>
            ))}
          </div>

          {/* 도메인/정렬 드롭다운 + Reset */}
          <div className="flex flex-wrap items-center gap-2">

            {/* 도메인 드롭다운 */}
            <div className="relative flex items-center">
              <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as DomainFilter)}
                className={`appearance-none pl-8 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent cursor-pointer ${
                  domainFilter !== "All"
                    ? "bg-emerald-50/80 border-emerald-200/60 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300"
                    : "bg-white border-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                }`}
                aria-label="도메인 필터"
              >
                <option value="All">도메인</option>
                <option value="common">공통</option>
                <option value="fintech">핀테크</option>
                <option value="commerce">커머스</option>
                <option value="saas">SaaS</option>
                <option value="platform">플랫폼</option>
                <option value="content">컨텐츠</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* 정렬 드롭다운 */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-8 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-neutral-500 focus:border-transparent cursor-pointer"
                aria-label="정렬 옵션"
              >
                <option value="difficulty-asc">난이도 낮은순</option>
                <option value="difficulty-desc">난이도 높은순</option>
                <option value="success-rate-desc">정답률 높은순</option>
                <option value="success-rate-asc">정답률 낮은순</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* 태그 필터 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFilters || selectedTags.length > 0
                  ? "bg-purple-50/80 text-purple-700 border border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
              aria-expanded={showFilters}
              aria-label="태그 필터"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">태그</span>
              {selectedTags.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-600 dark:bg-purple-700 text-white text-xs rounded-full min-w-[18px] text-center">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* Reset 버튼 - 활성 필터가 있을 때만 표시 */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 transition-colors"
                aria-label="모든 필터 초기화"
              >
                <X className="w-4 h-4" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 태그 필터 패널 */}
        {showFilters && availableTags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.slug}
                  onClick={() => handleTagToggle(tag.slug)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? "bg-purple-600 dark:bg-purple-700 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                  aria-pressed={selectedTags.includes(tag.slug)}
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
        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
          {showNewOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              NEW
              <button
                onClick={() => setShowNewOnly(false)}
                className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100"
                aria-label="NEW 필터 제거"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {difficultyFilter !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium">
              {DIFFICULTY_LABELS[difficultyFilter]}
              <button
                onClick={() => setDifficultyFilter("All")}
                className="ml-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                aria-label={`${DIFFICULTY_LABELS[difficultyFilter]} 필터 제거`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {domainFilter !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
              {DOMAIN_LABELS[domainFilter]}
              <button
                onClick={() => setDomainFilter("All")}
                className="ml-0.5 hover:text-emerald-900 dark:hover:text-emerald-100"
                aria-label={`${DOMAIN_LABELS[domainFilter]} 필터 제거`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTags.map((tagSlug) => {
            const tagModel = availableTags.find(t => t.slug === tagSlug);
            return (
              <span
                key={tagSlug}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
              >
                {tagModel?.labelKo || tagSlug}
                <button
                  onClick={() => handleTagToggle(tagSlug)}
                  className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100"
                  aria-label={`${tagModel?.labelKo || tagSlug} 태그 제거`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {debouncedSearchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium">
              &quot;{debouncedSearchQuery}&quot;
              <button
                onClick={() => setSearchQuery("")}
                className="ml-0.5 hover:text-neutral-900 dark:hover:text-neutral-100"
                aria-label="검색어 제거"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline ml-2"
          >
            모두 지우기
          </button>
        </div>
      )}

      {/* Coming Soon Banner - 항상 표시 */}
      {nextScheduled && (
        <ComingSoonBanner nextProblem={nextScheduled} />
      )}

      {sortedProblems.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-800 p-8 text-center transition-colors">
          <p className="text-neutral-600 dark:text-neutral-400">
            {hasActiveFilters
              ? "필터 조건에 맞는 문제가 없습니다."
              : "등록된 문제가 없습니다."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
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
                className="px-3 md:px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                aria-label="이전 페이지"
              >
                이전
              </button>
              <span className="px-3 md:px-4 py-2 text-neutral-700 dark:text-neutral-300 text-sm md:text-base" aria-current="page">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 md:px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                aria-label="다음 페이지"
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>

      {/* Pyodide 사전 로딩 - 문제 상세 페이지 진입 전에 미리 로드 */}
      <PyodidePreloader initializeImmediately={true} delay={2000} />
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function ProblemsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    }>
      <ProblemsContent />
    </Suspense>
  );
}

