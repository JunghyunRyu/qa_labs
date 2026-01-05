"use client";

import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginButton() {
  const { login, isLoading } = useAuth();

  const handleLoginClick = () => {
    // 런칭 초기 법적 리스크 방어를 위한 명시적 동의 절차 (Native Confirm)
    const isAgreed = window.confirm(
      "QA Arena 이용을 환영합니다! 👋\n\nGitHub 계정으로 계속하면 [이용약관] 및 [개인정보처리방침] 내용에 동의하는 것으로 간주됩니다.\n\n로그인을 진행하시겠습니까?"
    );

    if (isAgreed) {
      login();
    }
  };

  return (
    <button
      onClick={handleLoginClick}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
      // 마우스 오버 시에도 툴팁으로 고지
      title="로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다."
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      <span className="hidden sm:inline">GitHub 로그인</span>
    </button>
  );
}