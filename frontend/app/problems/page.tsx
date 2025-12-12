/** Problems list page */

"use client";

import { useEffect, useState, useMemo } from "react";
import { getProblems } from "@/lib/api/problems";
import { ApiError } from "@/lib/api";
import type { ProblemListResponse, ProblemListItem } from "@/types/problem";
import ProblemCard from "@/components/ProblemCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import Link from "next/link";
import { Search, Filter, X, Bookmark } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

type DifficultyFilter = "All" | "Very Easy" | "Easy" | "Medium" | "Hard";
type SortOption = "newest" | "oldest" | "difficulty-asc" | "difficulty-desc";

export default function ProblemsPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // 필터 및 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProblems(page, pageSize);
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
  };

  useEffect(() => {
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 필터링 및 정렬된 문제 목록
  const filteredAndSortedProblems = useMemo(() => {
    if (!data) return [];

    let filtered: ProblemListItem[] = [...data.problems];

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (problem) =>
          problem.title.toLowerCase().includes(query) ||
          problem.slug.toLowerCase().includes(query) ||
          problem.skills?.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    // 난이도 필터
    if (difficultyFilter !== "All") {
      filtered = filtered.filter((problem) => problem.difficulty === difficultyFilter);
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      filtered = filtered.filter((problem) =>
        selectedTags.every((tag) => problem.skills?.includes(tag))
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "difficulty-asc":
          const difficultyOrder = { "Very Easy": 0, Easy: 1, Medium: 2, Hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case "difficulty-desc":
          const difficultyOrderDesc = { "Very Easy": 0, Easy: 1, Medium: 2, Hard: 3 };
          return difficultyOrderDesc[b.difficulty] - difficultyOrderDesc[a.difficulty];
        case "oldest":
          return a.id - b.id;
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return sorted;
  }, [data, searchQuery, difficultyFilter, selectedTags, sortOption]);

  // 사용 가능한 모든 태그 추출
  const availableTags = useMemo(() => {
    if (!data) return [];
    const tagSet = new Set<string>();
    data.problems.forEach((problem) => {
      problem.skills?.forEach((skill) => tagSet.add(skill));
    });
    return Array.from(tagSet).sort();
  }, [data]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setSelectedTags([]);
    setSortOption("newest");
  };

  const hasActiveFilters = searchQuery || difficultyFilter !== "All" || selectedTags.length > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">문제 목록</h1>
            <p className="text-gray-600 dark:text-gray-400">
              총 {data.total}개의 문제가 있습니다.
              {hasActiveFilters && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (필터링 결과: {filteredAndSortedProblems.length}개)
                </span>
              )}
            </p>
          </div>
          {isAuthenticated && (
            <Link
              href="/problems/bookmarked"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors text-sm font-medium"
            >
              <Bookmark className="w-4 h-4" />
              북마크한 문제
            </Link>
          )}
        </div>
      </div>

      {/* 검색 및 필터 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 transition-colors">
        {/* 검색바 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="문제 제목, 슬러그, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base"
            aria-label="문제 검색"
          />
        </div>

        {/* 필터 토글 버튼 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
            aria-expanded={showFilters}
            aria-label="필터 표시/숨기기"
            aria-controls="filter-panel"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">필터</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {selectedTags.length + (difficultyFilter !== "All" ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              aria-label="필터 초기화"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">필터 초기화</span>
              <span className="sm:hidden">초기화</span>
            </button>
          )}
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div id="filter-panel" className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {/* 난이도 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                난이도
              </label>
              <div className="flex flex-wrap gap-2">
                {(["All", "Very Easy", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      difficultyFilter === diff
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    aria-pressed={difficultyFilter === diff}
                  >
                    {diff === "All" ? "전체" : diff === "Very Easy" ? "아주쉬움" : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* 태그 필터 */}
            {availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  태그
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-2 md:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                      aria-pressed={selectedTags.includes(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 정렬 옵션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                정렬
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm md:text-base"
                aria-label="정렬 옵션"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="difficulty-asc">난이도 낮은순</option>
                <option value="difficulty-desc">난이도 높은순</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {filteredAndSortedProblems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors">
          <p className="text-gray-600 dark:text-gray-400">
            {hasActiveFilters
              ? "필터 조건에 맞는 문제가 없습니다."
              : "등록된 문제가 없습니다."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
            {filteredAndSortedProblems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <nav aria-label="페이지 네비게이션" className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="이전 페이지"
              >
                이전
              </button>
              <span className="px-3 md:px-4 py-2 text-gray-700 dark:text-gray-300 text-sm md:text-base" aria-current="page">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

