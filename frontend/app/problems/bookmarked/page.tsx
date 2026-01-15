/**
 * Legacy bookmarked problems page - redirects to main problems page with bookmark filter
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookmarkedProblemsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to problems page with bookmark filter
    router.replace("/problems?bookmarked=true");
  }, [router]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm text-slate-400">이동 중...</span>
      </div>
    </div>
  );
}
