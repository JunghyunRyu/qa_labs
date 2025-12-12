"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { History, Bookmark } from "lucide-react";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-md p-1 hover:bg-[var(--card-background)] transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:block">{user.username}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[var(--card-background)] border border-[var(--card-border)] py-1 z-50">
          <div className="px-4 py-2 border-b border-[var(--card-border)]">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <Link
            href="/submissions"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors"
          >
            <span className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>내 제출 기록</span>
            </span>
          </Link>
          <Link
            href="/problems/bookmarked"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors"
          >
            <span className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4" />
              <span>북마크한 문제</span>
            </span>
          </Link>
          {user.github_username && (
            <a
              href={`https://github.com/${user.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Profile</span>
              </span>
            </a>
          )}
          <button
            onClick={async () => {
              await logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--background)] transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
