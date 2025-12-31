/** Problem card skeleton component for loading state */

export default function ProblemCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 h-full flex flex-col border-2 border-gray-200 dark:border-gray-700 min-h-[180px] sm:min-h-[200px] animate-pulse">
      {/* 도메인 + 난이도 */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>

      {/* 제목 */}
      <div className="space-y-2 mb-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>

      {/* 설명 */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3 flex-1" />

      {/* 태그 + 버그 수 */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-1">
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

/** Multiple skeletons for grid loading */
export function ProblemCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProblemCardSkeleton key={i} />
      ))}
    </div>
  );
}
