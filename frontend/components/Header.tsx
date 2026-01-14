/**
 * Header component with navigation and authentication
 * - Landing page: Glassmorphism, marketing-focused
 * - App pages: Solid dark, function-focused
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLayoutStore } from "@/stores/layoutStore";
import { Maximize2, Minimize2, ArrowRight } from "lucide-react";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";
import TokenBalance from "./TokenBalance";

// 홈(Landing) 메뉴 - 마케팅/소개 목적
const homeNavItems = [
  { label: "가이드", href: "/#how-it-works", anchor: "how-it-works", isAnchor: true },
  { label: "실전 예제", href: "/#scenario-showcase", anchor: "scenario-showcase", isAnchor: true },
  { label: "AI Copilot", href: "/#ai-features", anchor: "ai-features", isAnchor: true, isAI: true },
];

// 앱(내부) 메뉴 - 기능 목적
const appNavItems = [
  { label: "전체 문제", href: "/problems" },
  { label: "학습 현황", href: "/dashboard" },
];

export default function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isFocusMode, toggleFocusMode } = useLayoutStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProblemPage = pathname.startsWith("/problems/") && pathname !== "/problems";
  const showFocusMode = isProblemPage && isFocusMode;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 앵커 클릭 핸들러
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Focus mode: minimal header
  if (showFocusMode) {
    return (
      <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto flex h-8 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <span className="text-indigo-400">QA</span> Arena
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Focus Mode</span>
            <button
              data-testid="btn-exit-focus-mode"
              onClick={toggleFocusMode}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              title="Focus Mode 종료 (Alt+F)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              종료
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ========== LANDING PAGE HEADER ==========
  if (isHome) {
    return (
      <header className="fixed top-0 z-50 w-full bg-slate-950/60 backdrop-blur-lg border-b border-slate-800/50">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
          {/* Logo */}
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <Image src="/favicon.svg" alt="QA Arena Logo" width={28} height={28} className="rounded-md" />
            <span className="font-bold text-xl text-white">
              <span className="text-indigo-400">QA</span> Arena
            </span>
          </Link>

          {/* Navigation - Marketing focused */}
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            {homeNavItems.map((item) => (
              "isAI" in item && item.isAI ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.anchor)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-purple-500/10 group whitespace-nowrap"
                >
                  <span className="text-purple-400 group-hover:animate-pulse">✨</span>
                  <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.anchor)}
                  className="transition-colors text-slate-400 hover:text-white whitespace-nowrap"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right side - CTA focused */}
          <div className="flex items-center space-x-3">
            {mounted && !isLoading && (
              isAuthenticated ? (
                <Link
                  href="/problems"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  미션 컨트롤
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <LoginButton />
              )
            )}
            {mounted && isLoading && (
              <div className="w-24 h-9 rounded-lg bg-slate-800 animate-pulse" />
            )}
          </div>
        </div>
      </header>
    );
  }

  // ========== APP PAGE HEADER ==========
  return (
    <header className="fixed top-0 z-50 w-full bg-slate-950 border-b border-slate-800">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Image src="/favicon.svg" alt="QA Arena Logo" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-xl text-white">
            <span className="text-indigo-400">QA</span> Arena
          </span>
        </Link>

        {/* Navigation - Function focused */}
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium h-full">
          {appNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative h-full flex items-center transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-800 mx-4 hidden md:block" />

        {/* Right side - Utility focused */}
        <div className="flex items-center space-x-3">
          {/* Focus Mode Toggle (only on problem detail pages) */}
          {isProblemPage && mounted && (
            <button
              data-testid="btn-focus-mode"
              onClick={toggleFocusMode}
              className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
              aria-label="Focus Mode 전환"
              title="Focus Mode (Alt+F)"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}

          {/* Token Balance */}
          {mounted && !isLoading && isAuthenticated && <TokenBalance />}

          {/* Auth Section */}
          {mounted && !isLoading && (
            isAuthenticated ? <UserMenu /> : <LoginButton />
          )}
          {mounted && isLoading && (
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
