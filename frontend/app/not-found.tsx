import Link from "next/link";
import { Home, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-6">
          <span className="text-8xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5
                       bg-gray-900 dark:bg-white text-white dark:text-gray-900
                       rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100
                       transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
          <Link
            href="/problems"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5
                       bg-blue-500 text-white rounded-lg hover:bg-blue-600
                       transition-colors font-medium"
          >
            <FileText className="w-4 h-4" />
            문제 목록 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
