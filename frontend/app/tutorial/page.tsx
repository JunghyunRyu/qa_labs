"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * TutorialPage - 하위 호환을 위한 리다이렉트 페이지
 *
 * v1.1부터 튜토리얼은 /problems 페이지 내 오버레이로 표시됩니다.
 * 이 페이지는 기존 링크/북마크를 위해 /problems로 리다이렉트합니다.
 */
export default function TutorialPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/problems");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">문제 목록으로 이동 중...</p>
      </div>
    </div>
  );
}
