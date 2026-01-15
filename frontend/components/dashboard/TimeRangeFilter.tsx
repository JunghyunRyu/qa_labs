"use client";

import type { TimeRange } from "@/types/progress";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "90d", label: "90일" },
  { value: "all", label: "전체" },
];

export default function TimeRangeFilter({
  value,
  onChange,
}: TimeRangeFilterProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === range.value
              ? "bg-slate-700 text-indigo-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
