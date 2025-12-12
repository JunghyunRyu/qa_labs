"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { addBookmark, removeBookmark, getBookmarkStatus } from "@/lib/api/problems";

interface BookmarkButtonProps {
  problemId: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export default function BookmarkButton({
  problemId,
  size = "md",
  showLabel = false,
  className = "",
  onBookmarkChange,
}: BookmarkButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "w-4 h-4",
      button: "p-1.5",
      text: "text-xs",
    },
    md: {
      icon: "w-5 h-5",
      button: "p-2",
      text: "text-sm",
    },
    lg: {
      icon: "w-6 h-6",
      button: "p-2.5",
      text: "text-base",
    },
  };

  const config = sizeConfig[size];

  // Fetch bookmark status on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialized(true);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await getBookmarkStatus(problemId);
        setIsBookmarked(response.is_bookmarked);
      } catch (error) {
        console.error("Failed to fetch bookmark status:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchStatus();
  }, [problemId, isAuthenticated]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated || isLoading) return;

      setIsLoading(true);
      try {
        if (isBookmarked) {
          await removeBookmark(problemId);
          setIsBookmarked(false);
          onBookmarkChange?.(false);
        } else {
          await addBookmark(problemId);
          setIsBookmarked(true);
          onBookmarkChange?.(true);
        }
      } catch (error) {
        console.error("Failed to toggle bookmark:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, isBookmarked, isLoading, problemId, onBookmarkChange]
  );

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton while loading initial state
  if (!isInitialized) {
    return (
      <div
        className={`${config.button} rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`}
      >
        <div className={`${config.icon}`} />
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${config.button}
        rounded-lg
        transition-all duration-200
        ${
          isBookmarked
            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:hover:bg-yellow-900/60"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
        flex items-center gap-1.5
      `}
      aria-label={isBookmarked ? "북마크 제거" : "북마크 추가"}
      title={isBookmarked ? "북마크 제거" : "북마크 추가"}
    >
      <Bookmark
        className={`${config.icon} ${isBookmarked ? "fill-current" : ""}`}
      />
      {showLabel && (
        <span className={config.text}>
          {isBookmarked ? "북마크됨" : "북마크"}
        </span>
      )}
    </button>
  );
}
