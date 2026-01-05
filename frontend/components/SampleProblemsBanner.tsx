/** Sample Problems Banner - 신규 사용자 온보딩용 샘플 문제 안내 */

"use client";

import Link from "next/link";
import { Lightbulb, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

// 샘플 문제 ID (하드코딩)
const SAMPLE_SUCCESS_ID = 63; // 100점 정답 예시
const SAMPLE_FAILURE_ID = 64; // 실패 케이스 예시

export default function SampleProblemsBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          처음이신가요? 샘플 문제로 시작해보세요!
        </h2>
      </div>

      {/* 샘플 문제 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 성공 예시 카드 */}
        <Link
          href={`/problems/${SAMPLE_SUCCESS_ID}`}
          className="group bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-bold rounded">
                  100점 정답
                </span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                성공 케이스 체험하기
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                정답 코드가 미리 입력되어 있어요. 채점 버튼을 눌러 100점을 확인해보세요!
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>

        {/* 실패 예시 카드 */}
        <Link
          href={`/problems/${SAMPLE_FAILURE_ID}`}
          className="group bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex-shrink-0">
              <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-bold rounded">
                  실패 예시
                </span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                실패 케이스 확인하기
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                버그를 놓치는 테스트 코드 예시예요. 어떤 점이 부족한지 확인해보세요.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}
