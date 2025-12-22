/**
 * Header component with theme toggle, navigation, and authentication
 */

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";

// 홈 variant 메뉴 항목
const homeNavItems = [
  { label: "문제 보기", href: "/problems", isAnchor: false },
  { label: "진행 방식", href: "/#how-it-works", anchor: "how-it-works", isAnchor: true },
  { label: "AI 피드백", href: "/#ai-feedback", anchor: "ai-feedback", isAnchor: true },
  { label: "시나리오", href: "/#scenario-showcase", anchor: "scenario-showcase", isAnchor: true },
];

// 앱 variant 메뉴 항목
const appNavItems = [
  { label: "Problems", href: "/problems" },
];

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // 홈페이지면 home variant, 그 외는 app variant
  const isHome = pathname === "/";
  const navItems = isHome ? homeNavItems : appNavItems;

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 앵커 클릭 핸들러: 홈에서는 스무스 스크롤, 다른 페이지에서는 /#id로 이동
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    // 홈이 아니면 Link의 기본 동작 (/#id로 페이지 이동)
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">QA-Arena</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={
                "isAnchor" in item && item.isAnchor && "anchor" in item
                  ? (e) => handleAnchorClick(e, item.anchor as string)
                  : undefined
              }
              className="transition-colors hover:text-[var(--accent)] text-[var(--muted)] whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Theme Toggle + Auth */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          {mounted ? (
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-[var(--card-background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            >
              {resolvedTheme === "dark" ? (
                // Sun icon for light mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          ) : (
            // Placeholder to prevent layout shift
            <div className="w-9 h-9" />
          )}

          {/* Auth Section */}
          {mounted && !isLoading && (
            isAuthenticated ? <UserMenu /> : <LoginButton />
          )}
          {mounted && isLoading && (
            <div className="w-8 h-8 rounded-full bg-[var(--card-background)] animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
