"use client";

/**
 * PreviewPanel Component
 *
 * HowItWorks 섹션의 오른쪽 프리뷰 패널.
 * Step 클릭 시 해당 단계의 프리뷰를 표시합니다.
 * Phase 1.5: 자동재생 없음, 클릭 시에만 변경.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  CheckCircle2,
  Bug,
  Target,
  Trophy,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PreviewPanelProps {
  activeStepId: number;
}

/** Step 1: 테스트 작성 프리뷰 */
function WriteTestsPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Code2 className="w-5 h-5" />
        <span className="font-semibold">테스트 코드 작성</span>
      </div>
      <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-300 overflow-x-auto">
        <pre className="whitespace-pre-wrap">
{`def test_is_prime():
    assert is_prime(2) == True
    assert is_prime(7) == True
    assert is_prime(1) == False
    assert is_prime(4) == False`}
        </pre>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        다양한 입력 케이스를 커버하는 테스트를 작성합니다.
      </p>
    </div>
  );
}

/** Step 2: 기본 검증 프리뷰 */
function ValidatePreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-semibold">정상 코드 검증</span>
      </div>
      <div className="rounded-xl border-2 border-green-500/30 bg-green-50 dark:bg-green-950/30 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
        <div className="text-lg font-bold text-green-700 dark:text-green-300">
          모든 테스트 통과
        </div>
        <div className="text-sm text-green-600 dark:text-green-400 mt-1">
          4/4 테스트 성공
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        정답 코드(Golden Code)에서 테스트가 통과하는지 확인합니다.
      </p>
    </div>
  );
}

/** Step 3: 뮤턴트 생성 프리뷰 */
function MutantsPreview() {
  const mutants = [
    { id: 1, desc: "return 조건 반전", code: "n < 2" },
    { id: 2, desc: "경계값 변경", code: "i <= sqrt(n)" },
    { id: 3, desc: "연산자 변경", code: "n % i != 0" },
    { id: 4, desc: "반환값 변경", code: "return True" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <Bug className="w-5 h-5" />
        <span className="font-semibold">버그 코드(Mutant) 생성</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {mutants.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-3"
          >
            <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
              Mutant #{m.id}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {m.desc}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        정상 코드에 의도적인 버그를 심어 변형 코드를 만듭니다.
      </p>
    </div>
  );
}

/** Step 4: 탐지율 측정 프리뷰 */
function DetectionPreview() {
  const results = [
    { id: 1, detected: true },
    { id: 2, detected: true },
    { id: 3, detected: false },
    { id: 4, detected: true },
  ];
  const killed = results.filter((r) => r.detected).length;
  const total = results.length;
  const percentage = Math.round((killed / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <Target className="w-5 h-5" />
        <span className="font-semibold">버그 탐지율 측정</span>
      </div>

      {/* 결과 테이블 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                Mutant
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">
                결과
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((r) => (
              <tr key={r.id} className="bg-white dark:bg-gray-900">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  Mutant #{r.id}
                </td>
                <td className="px-3 py-2 text-center">
                  {r.detected ? (
                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                      <CheckCircle2 className="w-4 h-4" />
                      탐지됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      미탐지
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 탐지율 */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          버그 탐지율
        </span>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {percentage}% ({killed}/{total})
        </span>
      </div>
    </div>
  );
}

/** Step 5: 점수 & 피드백 프리뷰 */
function ScorePreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Trophy className="w-5 h-5" />
        <span className="font-semibold">점수 & AI 피드백</span>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            75%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            버그 탐지율
          </div>
        </div>
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            B+
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            테스트 품질
          </div>
        </div>
      </div>

      {/* AI 피드백 */}
      <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            AI 피드백
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          음수/빈 리스트 케이스 누락 → 우선순위 1
        </p>
        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li>• 빈 리스트 테스트 추가 권장</li>
          <li>• 음수 입력 테스트 추가 권장</li>
        </ul>
      </div>
    </div>
  );
}

export default function PreviewPanel({ activeStepId }: PreviewPanelProps) {
  const renderPreview = () => {
    switch (activeStepId) {
      case 1:
        return <WriteTestsPreview />;
      case 2:
        return <ValidatePreview />;
      case 3:
        return <MutantsPreview />;
      case 4:
        return <DetectionPreview />;
      case 5:
        return <ScorePreview />;
      default:
        return <DetectionPreview />;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950/50">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Mutation Testing 흐름
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          좌측 단계를 클릭하여 각 과정을 확인하세요
        </div>
      </div>

      {/* Preview Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {renderPreview()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
