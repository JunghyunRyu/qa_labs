"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import TermsModal from "@/components/TermsModal";

type CallbackStatus = "loading" | "terms" | "success" | "error";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth, acceptTerms, declineTerms } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      const isNew = searchParams.get("is_new") === "true";

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error || "인증에 실패했습니다");
        return;
      }

      // Backend handles the OAuth callback and sets cookies
      // We just need to refresh the auth state
      try {
        await refreshAuth();

        // Show terms modal for new users
        if (isNew) {
          setStatus("terms");
        } else {
          setStatus("success");
          // 저장된 redirect URL로 이동 (없으면 메인)
          const savedRedirect = sessionStorage.getItem("auth_redirect") || "/";
          sessionStorage.removeItem("auth_redirect");
          setTimeout(() => {
            router.push(savedRedirect);
          }, 500);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("인증을 완료하지 못했습니다");
      }
    };

    handleCallback();
  }, [searchParams, refreshAuth, router]);

  const handleAcceptTerms = async () => {
    setIsAcceptingTerms(true);
    try {
      await acceptTerms();
      setStatus("success");
      // 신규 가입자는 문제 목록으로 바로 이동 (온보딩 유도)
      setTimeout(() => {
        router.push("/problems?welcome=true");
      }, 500);
    } catch (err) {
      setStatus("error");
      setErrorMessage("약관 동의 처리에 실패했습니다");
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  const handleDeclineTerms = async () => {
    // User declined terms - delete account and redirect to home
    try {
      await declineTerms();
    } catch (err) {
      // Even if API fails, redirect home
      console.error('Failed to decline terms:', err);
    }
    router.push("/");
  };

  // Loading & Success state - same visual (seamless transition)
  if (status === "loading" || status === "success") {
    return (
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="font-bold text-2xl text-indigo-500 tracking-tight">
          QA Arena
        </div>

        {/* Loading Spinner */}
        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />

        {/* Status Message */}
        <p className="text-sm text-slate-400 font-mono">
          {status === "loading" ? "Authenticating..." : "Redirecting..."}
        </p>
      </div>
    );
  }

  // Terms modal for new users
  if (status === "terms") {
    return (
      <TermsModal
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        isLoading={isAcceptingTerms}
      />
    );
  }

  // Error state
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Error Icon */}
      <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center">
        <svg
          className="w-6 h-6 text-rose-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <div className="text-center">
        <h1 className="text-lg font-semibold text-slate-100 mb-2">인증 실패</h1>
        <p className="text-sm text-slate-400 mb-6">{errorMessage}</p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="px-5 py-2.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-bold text-2xl text-indigo-500 tracking-tight">
        QA Arena
      </div>
      <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-mono">Loading...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Suspense fallback={<LoadingFallback />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
