"use client";

import Link from "next/link";

interface TermsModalProps {
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export default function TermsModal({ onAccept, onDecline, isLoading }: TermsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            QA Arena에 오신 것을 환영합니다!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            서비스 이용을 위해 아래 약관에 동의해 주세요.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            계속 진행하시면{" "}
            <Link
              href="/terms"
              className="text-blue-500 hover:underline font-medium"
              target="_blank"
            >
              이용약관
            </Link>
            {" "}및{" "}
            <Link
              href="/privacy"
              className="text-blue-500 hover:underline font-medium"
              target="_blank"
            >
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리중...
              </>
            ) : (
              "동의하고 계속하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
