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
          // Redirect to home after a brief delay
          setTimeout(() => {
            router.push("/");
          }, 1500);
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
      setTimeout(() => {
        router.push("/");
      }, 1500);
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

  return (
    <div className="text-center">
      {status === "loading" && (
        <>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">인증 중...</h1>
          <p className="text-gray-500 dark:text-gray-400">로그인을 완료하는 중입니다. 잠시만 기다려주세요.</p>
        </>
      )}

      {status === "terms" && (
        <TermsModal
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
          isLoading={isAcceptingTerms}
        />
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">로그인 성공!</h1>
          <p className="text-gray-500 dark:text-gray-400">홈페이지로 이동 중...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-white"
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">인증 실패</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            홈으로 돌아가기
          </button>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">로딩 중...</h1>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Suspense fallback={<LoadingFallback />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
