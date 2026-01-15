/**
 * Submission filters component.
 */

"use client";

import type { SubmissionStatus, SubmissionFilters as FiltersType } from "@/types/submission";
import { Filter, X } from "lucide-react";

interface SubmissionFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const statusOptions: { value: SubmissionStatus | ""; label: string }[] = [
  { value: "", label: "전체 상태" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILURE", label: "실패" },
  { value: "ERROR", label: "에러" },
];

const daysOptions: { value: number | undefined; label: string }[] = [
  { value: undefined, label: "전체 기간" },
  { value: 7, label: "최근 7일" },
  { value: 30, label: "최근 30일" },
];

export default function SubmissionFilters({
  filters,
  onFiltersChange,
}: SubmissionFiltersProps) {
  const hasActiveFilters = filters.status || filters.days;

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value ? (value as SubmissionStatus) : undefined,
    });
  };

  const handleDaysChange = (value: string) => {
    onFiltersChange({
      ...filters,
      days: value ? parseInt(value, 10) : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">필터</span>
      </div>

      {/* Status filter */}
      <select
        value={filters.status || ""}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Days filter */}
      <select
        value={filters.days?.toString() || ""}
        onChange={(e) => handleDaysChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-slate-800 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
      >
        {daysOptions.map((option) => (
          <option key={option.value ?? "all"} value={option.value ?? ""}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">초기화</span>
        </button>
      )}

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 ml-2">
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
              {statusOptions.find((o) => o.value === filters.status)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="hover:text-indigo-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.days && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
              {daysOptions.find((o) => o.value === filters.days)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, days: undefined })}
                className="hover:text-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
