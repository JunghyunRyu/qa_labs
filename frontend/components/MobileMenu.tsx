/**
 * Mobile Menu Component
 * - Hamburger menu for mobile/tablet
 * - Slide-in drawer with overlay
 * - Supports both home (marketing) and app navigation
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";
import TokenBalance from "./TokenBalance";
import RankBadge from "./RankBadge";

interface MobileMenuProps {
  isHome: boolean;
  homeNavItems: Array<{
    label: string;
    href: string;
    anchor: string;
    isAnchor?: boolean;
    isAI?: boolean;
  }>;
  appNavItems: Array<{
    label: string;
    href: string;
  }>;
}

export default function MobileMenu({ isHome, homeNavItems, appNavItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Anchor click handler for home page
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    }
  };

  const navItems = isHome ? homeNavItems : appNavItems;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
        aria-label="메뉴 열기"
        aria-expanded={isOpen}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-slate-950 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-lg font-bold text-white">
            <span className="text-indigo-400">QA</span> Arena
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
            aria-label="메뉴 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Section (App pages only) */}
        {!isHome && !isLoading && isAuthenticated && user && (
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <UserMenu />
              <TokenBalance />
            </div>
            <RankBadge solvedCount={user.solved_count || 0} />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = !isHome && (pathname === item.href || pathname.startsWith(item.href + "/"));

            return "isAI" in item && item.isAI ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => "anchor" in item ? handleAnchorClick(e, item.anchor as string) : undefined}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-purple-500/10 group min-h-[44px]"
              >
                <span className="text-purple-400 group-hover:animate-pulse text-xl">✨</span>
                <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {item.label}
                </span>
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => "isAnchor" in item && item.isAnchor ? handleAnchorClick(e, "anchor" in item ? item.anchor as string : "") : undefined}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-indigo-500/10 text-white font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom CTA Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm">
          {!isLoading && (
            isAuthenticated ? (
              isHome && (
                <Link
                  href="/problems"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors min-h-[48px]"
                  onClick={() => setIsOpen(false)}
                >
                  미션 컨트롤
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <div onClick={() => setIsOpen(false)}>
                <LoginButton />
              </div>
            )
          )}
          {isLoading && (
            <div className="w-full h-12 rounded-lg bg-slate-800 animate-pulse" />
          )}
        </div>
      </div>
    </>
  );
}
