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

// 난이도 Pill 버튼 색상 (선택/비선택) - GitHub Dark 스타일
const DIFFICULTY_PILL_COLORS: Record<DifficultyFilter, { active: string; inactive: string }> = {
  All: {
    active: "bg-[#c9d1d9] text-[#0d1117] dark:bg-[#c9d1d9] dark:text-[#0d1117]",
    inactive: "bg-[#f6f8fa] text-[#57606a] hover:bg-[#d0d7de] dark:bg-[#21262d] dark:text-[#8b949e] dark:hover:bg-[#30363d]",
  },
  "Very Easy": {
    active: "bg-[#58a6ff] text-white dark:bg-[#58a6ff] dark:text-white",
    inactive: "bg-[#ddf4ff] text-[#0969da] hover:bg-[#b6e3ff] dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:hover:bg-[#388bfd40]",
  },
  Easy: {
    active: "bg-[#3fb950] text-white dark:bg-[#3fb950] dark:text-white",
    inactive: "bg-[#dafbe1] text-[#1a7f37] hover:bg-[#aceebb] dark:bg-[#238636]/20 dark:text-[#3fb950] dark:hover:bg-[#238636]/40",
  },
  Medium: {
    active: "bg-[#d29922] text-white dark:bg-[#d29922] dark:text-white",
    inactive: "bg-[#fff8c5] text-[#9a6700] hover:bg-[#fae17d] dark:bg-[#9e6a03]/20 dark:text-[#d29922] dark:hover:bg-[#9e6a03]/40",
  },
  Hard: {
    active: "bg-[#f85149] text-white dark:bg-[#f85149] dark:text-white",
    inactive: "bg-[#ffebe9] text-[#cf222e] hover:bg-[#ffc1ba] dark:bg-[#f85149]/20 dark:text-[#f85149] dark:hover:bg-[#f85149]/40",
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
          <div className="h-9 w-32 bg-[#d0d7de] dark:bg-[#30363d] rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-[#d0d7de] dark:bg-[#30363d] rounded animate-pulse" />
        </div>
        {/* Control Bar Skeleton */}
        <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-md p-4 mb-4 animate-pulse border border-[#d0d7de] dark:border-[#30363d]">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="h-10 flex-1 bg-[#d0d7de] dark:bg-[#30363d] rounded-lg" />
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-[#d0d7de] dark:bg-[#30363d] rounded-full" />
              <div className="h-10 w-20 bg-[#d0d7de] dark:bg-[#30363d] rounded-full" />
              <div className="h-10 w-20 bg-[#d0d7de] dark:bg-[#30363d] rounded-full" />
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
            <h1 className="text-3xl font-bold text-[#24292f] dark:text-[#c9d1d9] mb-2">문제 목록</h1>
            {hasActiveFilters ? (
              <p className="text-[#57606a] dark:text-[#8b949e] text-sm">
                필터링 결과: {data.total}개
              </p>
            ) : (
              <ProblemStatsRow />
            )}
          </div>
          {isAuthenticated && (
            <Link
              href="/problems/bookmarked"
              className="flex items-center gap-2 px-4 py-2 bg-[#fff8c5] dark:bg-[#9e6a03]/20 text-[#9a6700] dark:text-[#d29922] rounded-lg hover:bg-[#fae17d] dark:hover:bg-[#9e6a03]/40 transition-colors text-sm font-medium"
            >
              <Bookmark className="w-4 h-4" />
              북마크한 문제
            </Link>
          )}
        </div>
      </div>

      {/* 컨트롤 바 - 검색 + 빠른 필터 + 정렬 */}
      <div className="sticky top-14 z-30 bg-white dark:bg-[#161b22] rounded-lg shadow-md p-4 mb-4 transition-colors border border-[#d0d7de] dark:border-[#30363d]">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 검색창 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#57606a] dark:text-[#8b949e] w-5 h-5" />
            <input
              type="text"
              placeholder="문제 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#d0d7de] dark:border-[#30363d] rounded-lg focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#c9d1d9] placeholder-[#6e7781] dark:placeholder-[#6e7681] text-sm"
              aria-label="문제 검색"
            />
          </div>

          {/* NEW 필터 + 난이도 Pill 버튼 */}
          <div className="flex items-center gap-1" role="group" aria-label="필터">
            {/* NEW 필터 버튼 - GitHub Dark 스타일: 하늘색 */}
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                showNewOnly
                  ? "bg-[#58a6ff] text-white"
                  : "bg-[#ddf4ff] text-[#0969da] hover:bg-[#b6e3ff] dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:hover:bg-[#388bfd40]"
              }`}
              aria-pressed={showNewOnly}
            >
              <Sparkles className="w-3 h-3" />
              NEW
            </button>
            <span className="w-px h-5 bg-[#d0d7de] dark:bg-[#30363d] mx-1" />
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
              <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6e7781] dark:text-[#8b949e] pointer-events-none" />
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as DomainFilter)}
                className={`appearance-none pl-8 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent cursor-pointer ${
                  domainFilter !== "All"
                    ? "bg-[#dafbe1] border-[#aceebb] text-[#1a7f37] dark:bg-[#238636]/20 dark:border-[#238636]/40 dark:text-[#3fb950]"
                    : "bg-white border-[#d0d7de] text-[#24292f] dark:bg-[#0d1117] dark:border-[#30363d] dark:text-[#c9d1d9]"
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
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6e7781] dark:text-[#8b949e] pointer-events-none" />
            </div>

            {/* 정렬 드롭다운 */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6e7781] dark:text-[#8b949e] pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-8 py-2 border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#c9d1d9] focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent cursor-pointer"
                aria-label="정렬 옵션"
              >
                <option value="difficulty-asc">난이도 낮은순</option>
                <option value="difficulty-desc">난이도 높은순</option>
                <option value="success-rate-desc">정답률 높은순</option>
                <option value="success-rate-asc">정답률 낮은순</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6e7781] dark:text-[#8b949e] pointer-events-none" />
            </div>

            {/* 태그 필터 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showFilters || selectedTags.length > 0
                  ? "bg-[#ddf4ff] text-[#0969da] border border-[#b6e3ff] dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:border-[#388bfd40]"
                  : "bg-[#f6f8fa] text-[#24292f] border border-[#d0d7de] dark:bg-[#21262d] dark:text-[#c9d1d9] dark:border-[#30363d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d]"
              }`}
              aria-expanded={showFilters}
              aria-label="태그 필터"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">태그</span>
              {selectedTags.length > 0 && (
                <span className="px-1.5 py-0.5 bg-[#58a6ff] text-white text-xs rounded-full min-w-[18px] text-center">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* Reset 버튼 - 활성 필터가 있을 때만 표시 */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#ffebe9] text-[#cf222e] border border-[#ffc1ba] hover:bg-[#ffc1ba] dark:bg-[#f85149]/20 dark:text-[#f85149] dark:border-[#f85149]/40 dark:hover:bg-[#f85149]/30 transition-colors"
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
          <div className="mt-4 pt-4 border-t border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.slug}
                  onClick={() => handleTagToggle(tag.slug)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? "bg-[#58a6ff] text-white"
                      : "bg-[#f6f8fa] dark:bg-[#21262d] text-[#24292f] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d]"
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] rounded-full text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              NEW
              <button
                onClick={() => setShowNewOnly(false)}
                className="ml-0.5 hover:text-[#0550ae] dark:hover:text-[#79c0ff]"
                aria-label="NEW 필터 제거"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {difficultyFilter !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f6f8fa] dark:bg-[#21262d] text-[#24292f] dark:text-[#c9d1d9] rounded-full text-xs font-medium">
              {DIFFICULTY_LABELS[difficultyFilter]}
              <button
                onClick={() => setDifficultyFilter("All")}
                className="ml-0.5 hover:text-[#0d1117] dark:hover:text-white"
                aria-label={`${DIFFICULTY_LABELS[difficultyFilter]} 필터 제거`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {domainFilter !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] rounded-full text-xs font-medium">
              {DOMAIN_LABELS[domainFilter]}
              <button
                onClick={() => setDomainFilter("All")}
                className="ml-0.5 hover:text-[#116329] dark:hover:text-[#56d364]"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] rounded-full text-xs font-medium"
              >
                {tagModel?.labelKo || tagSlug}
                <button
                  onClick={() => handleTagToggle(tagSlug)}
                  className="ml-0.5 hover:text-[#0550ae] dark:hover:text-[#79c0ff]"
                  aria-label={`${tagModel?.labelKo || tagSlug} 태그 제거`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {debouncedSearchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f6f8fa] dark:bg-[#21262d] text-[#24292f] dark:text-[#c9d1d9] rounded-full text-xs font-medium">
              &quot;{debouncedSearchQuery}&quot;
              <button
                onClick={() => setSearchQuery("")}
                className="ml-0.5 hover:text-[#0d1117] dark:hover:text-white"
                aria-label="검색어 제거"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-[#6e7781] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#c9d1d9] underline ml-2"
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
        <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-md border border-[#d0d7de] dark:border-[#30363d] p-8 text-center transition-colors">
          <p className="text-[#57606a] dark:text-[#8b949e]">
            {hasActiveFilters
              ? "필터 조건에 맞는 문제가 없습니다."
              : "등록된 문제가 없습니다."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-[#24292f] dark:bg-[#f0f6fc] text-white dark:text-[#24292f] rounded-lg hover:bg-[#32383f] dark:hover:bg-[#d0d7de] transition-colors"
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
                className="px-3 md:px-4 py-2 bg-[#f6f8fa] dark:bg-[#21262d] text-[#24292f] dark:text-[#c9d1d9] rounded hover:bg-[#eaeef2] dark:hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2"
                aria-label="이전 페이지"
              >
                이전
              </button>
              <span className="px-3 md:px-4 py-2 text-[#24292f] dark:text-[#c9d1d9] text-sm md:text-base" aria-current="page">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 md:px-4 py-2 bg-[#f6f8fa] dark:bg-[#21262d] text-[#24292f] dark:text-[#c9d1d9] rounded hover:bg-[#eaeef2] dark:hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2"
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
          className="text-[#57606a] hover:text-[#24292f] dark:text-[#8b949e] dark:hover:text-[#c9d1d9] transition-colors"
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

