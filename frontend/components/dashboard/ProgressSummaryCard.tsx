"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressSummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  iconBgColor?: string; // Custom background color for icon (e.g., "bg-green-50 dark:bg-green-900/20")
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  format?: "number" | "percent" | "ratio";
}

export default function ProgressSummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-blue-50 dark:bg-blue-900/20",
  trend,
  trendValue,
  format = "number",
}: ProgressSummaryCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "ratio":
        return val.toFixed(2);
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${getTrendColor()}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
