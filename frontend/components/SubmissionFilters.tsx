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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">필터</span>
        </div>

        {/* Status filter */}
        <select
          value={filters.status || ""}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            필터 초기화
          </button>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">
                상태: {statusOptions.find((o) => o.value === filters.status)?.label}
                <button
                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.days && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-xs">
                기간: {daysOptions.find((o) => o.value === filters.days)?.label}
                <button
                  onClick={() => onFiltersChange({ ...filters, days: undefined })}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
