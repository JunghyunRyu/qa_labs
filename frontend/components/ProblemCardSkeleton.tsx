/** Problem card skeleton component - Mission Control Dark Theme */

export default function ProblemCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-full flex flex-col min-h-[200px] animate-pulse">
      {/* Header: 난이도 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-16 bg-slate-800 rounded-md" />
        <div className="h-5 w-5 bg-slate-800 rounded" />
      </div>

      {/* Title (2줄) */}
      <div className="space-y-2 mb-3">
        <div className="h-5 bg-slate-800 rounded w-full" />
        <div className="h-5 bg-slate-800 rounded w-3/4" />
      </div>

      {/* Description (2줄) */}
      <div className="space-y-1.5 mb-4 flex-1">
        <div className="h-4 bg-slate-800/70 rounded w-full" />
        <div className="h-4 bg-slate-800/70 rounded w-5/6" />
      </div>

      {/* Footer: 태그 + 메타 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
        <div className="flex gap-1.5">
          <div className="h-5 w-12 bg-slate-800 rounded" />
          <div className="h-5 w-14 bg-slate-800 rounded" />
        </div>
        <div className="h-4 w-8 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

/** Multiple skeletons for grid loading */
export function ProblemCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProblemCardSkeleton key={i} />
      ))}
    </div>
  );
}
