"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressSummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  format?: "number" | "percent" | "ratio";
}

export default function ProgressSummaryCard({
  title,
  value,
  subtitle,
  icon,
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
