"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`${
                    isLast
                      ? "text-gray-600 dark:text-gray-400 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] truncate"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title={isLast ? item.label : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
