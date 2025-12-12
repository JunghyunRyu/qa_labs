"use client";

import { useState } from "react";
import { toTagViewModels, sliceTags, type TagViewModel } from "@/lib/tagDefinitions";

interface TagChipsProps {
  tags: string[];
  maxVisible?: number;
  size?: "sm" | "md";
}

export default function TagChips({ tags, maxVisible = 6, size = "md" }: TagChipsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tagModels = toTagViewModels(tags);

  if (tagModels.length === 0) return null;

  const { visible, hiddenCount } = sliceTags(tagModels, maxVisible);
  const displayTags = isExpanded ? tagModels : visible;
  const showExpandButton = hiddenCount > 0 && !isExpanded;
  const showCollapseButton = isExpanded && tagModels.length > maxVisible;

  const chipClasses = size === "sm"
    ? "px-2 py-0.5 text-xs"
    : "px-3 py-1 text-xs";

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => (
        <span
          key={tag.slug}
          className={`${chipClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md`}
        >
          {tag.labelKo}
        </span>
      ))}
      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`${chipClasses} bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer`}
        >
          +{hiddenCount}
        </button>
      )}
      {showCollapseButton && (
        <button
          onClick={() => setIsExpanded(false)}
          className={`${chipClasses} bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer`}
        >
          접기
        </button>
      )}
    </div>
  );
}
