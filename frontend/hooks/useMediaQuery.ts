"use client";

import { useState, useEffect } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

interface MediaQueryResult {
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 1023px
  isDesktop: boolean; // >= 1024px
  breakpoint: Breakpoint;
}

export function useMediaQuery(): MediaQueryResult {
  const [result, setResult] = useState<MediaQueryResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "desktop",
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setResult({
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          breakpoint: "mobile",
        });
      } else if (width < 1024) {
        setResult({
          isMobile: false,
          isTablet: true,
          isDesktop: false,
          breakpoint: "tablet",
        });
      } else {
        setResult({
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          breakpoint: "desktop",
        });
      }
    };

    // Initial check
    updateBreakpoint();

    // Add listener
    window.addEventListener("resize", updateBreakpoint);

    return () => {
      window.removeEventListener("resize", updateBreakpoint);
    };
  }, []);

  return result;
}

// Simple hook for a single media query
export function useMediaQueryMatch(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
