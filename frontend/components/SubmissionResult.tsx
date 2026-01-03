/** Submission result display component */

import type { Submission } from "@/types/problem";
import SubmissionStatus from "./SubmissionStatus";
import ScoreDisplay from "./ScoreDisplay";
import FeedbackDisplay from "./FeedbackDisplay";
import TestResultsList from "./TestResultsList";
import ErrorLogDisplay from "./ErrorLogDisplay";
import { TestQualityPanel } from "./test-quality";
import { parsePytestOutput } from "@/lib/pytestParser";
import { AlertCircle, FileText, Sparkles, Lock, RefreshCw, ArrowRight, Lightbulb } from "lucide-react";
import { Github } from "lucide-react";
import Link from "next/link";
import type { QualityGrade, TestQualityAnalysis } from "@/types/test-quality";

interface SubmissionResultProps {
  submission: Submission;
  onRetry?: () => void;
  problemId?: string;
}

export default function SubmissionResult({ submission, onRetry, problemId }: SubmissionResultProps) {
  // FAILURE 상태일 때 Golden Code 테스트 실패 정보 추출
  const getFailureInfo = () => {
    if (submission.status !== "FAILURE" || !submission.execution_log) return null;
    
    const golden = (submission.execution_log as any)?.golden;
    if (!golden) return null;

    return {
      exitCode: golden.exit_code,
      stdout: golden.stdout || "",
      stderr: golden.stderr || "",
      logs: golden.logs || "",
    };
  };

  const failureInfo = getFailureInfo();

  // Parse pytest output for FAILURE status
  const parsedGolden = submission.status === "FAILURE" && submission.execution_log
    ? parsePytestOutput(
        ((submission.execution_log as any)?.golden?.stdout || ""),
        ((submission.execution_log as any)?.golden?.stderr || "")
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Status - Always shown */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">제출 상태</h3>
        </div>
        <SubmissionStatus status={submission.status} createdAt={submission.created_at} />
      </div>

      {/* Score - Always shown in the same location */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            채점 결과
          </h3>
          <ScoreDisplay
            score={submission.score}
            killedMutants={submission.killed_mutants}
            totalMutants={submission.total_mutants}
            executionMode={submission.execution_mode}
            verified={submission.verified}
            verificationStatus={submission.verification_status}
          />
        </div>
      )}

      {/* Test Quality Analysis - Shown for SUCCESS status */}
      {submission.status === "SUCCESS" && submission.test_quality_analysis && (
        <TestQualityPanel
          submissionId={submission.id}
          score={submission.test_quality_score}
          grade={submission.test_quality_grade as QualityGrade | undefined}
          analysis={submission.test_quality_analysis as unknown as TestQualityAnalysis}
          showHints={!!submission.user_id}
          defaultExpanded={false}
        />
      )}

      {/* FAILURE 상태 상세 정보 */}
      {submission.status === "FAILURE" && failureInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">테스트 실패 상세</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-orange-800 mb-2">
                테스트 실행에 실패했습니다
              </p>
              <p className="text-sm text-orange-700">
                작성하신 테스트가 정답 코드를 통과시키지 못했습니다.
                테스트 코드를 확인해주세요.
              </p>
            </div>

            {/* 수정 가이드 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">어떻게 수정할까요?</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>테스트가 <strong>정상 동작하는 코드</strong>를 통과해야 합니다</li>
                    <li>assert 문의 기대값이 올바른지 확인하세요</li>
                    <li>함수 이름, 파라미터가 문제 설명과 일치하는지 확인하세요</li>
                    <li>경계값이나 특수 케이스에서 예상치 못한 결과가 나오지 않는지 점검하세요</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test results breakdown */}
            {parsedGolden?.tests && parsedGolden.tests.length > 0 && (
              <div className="mt-4">
                <TestResultsList tests={parsedGolden.tests} />
              </div>
            )}

            {failureInfo.stderr && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-orange-800 hover:text-orange-900 mb-2">
                  에러 출력 보기
                </summary>
                <div className="mt-2 bg-white rounded p-3 border border-orange-200">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto font-mono">
                    {failureInfo.stderr}
                  </pre>
                </div>
              </details>
            )}

            {failureInfo.logs && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-orange-800 hover:text-orange-900 mb-2">
                  실행 로그 보기
                </summary>
                <div className="mt-2 bg-white rounded p-3 border border-orange-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto font-mono">
                    {failureInfo.logs}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Error Message - Shown when status is ERROR */}
      {submission.status === "ERROR" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-800">채점 에러</h4>
          </div>
          <ErrorLogDisplay executionLog={submission.execution_log} />
        </div>
      )}

      {/* AI Feedback - Only shown for SUCCESS status */}
      {submission.status === "SUCCESS" && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI 피드백</h3>
          </div>
          {submission.feedback_json ? (
            // 피드백이 있는 경우 (회원 제출)
            <FeedbackDisplay feedback={submission.feedback_json as any} />
          ) : submission.user_id ? (
            // 회원인데 피드백이 없는 경우 (생성 중)
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
              <p className="text-sm text-gray-600">
                AI가 피드백을 생성하고 있습니다...
              </p>
            </div>
          ) : (
            // 게스트인 경우 로그인 유도
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                AI 피드백은 회원 전용 기능입니다
              </p>
              <p className="text-sm text-gray-500 mb-6">
                로그인하면 상세한 AI 피드백과 개선 제안을 받을 수 있습니다.
              </p>
              <a
                href="/api/v1/auth/github/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Github className="w-5 h-5" />
                GitHub로 로그인
              </a>
            </div>
          )}
        </div>
      )}

      {/* CTA 버튼 섹션 - SUCCESS 또는 FAILURE 상태에서 표시 */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">다음 단계</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 다시 제출 버튼 */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                {submission.status === "FAILURE" ? "코드 수정 후 다시 제출" : "다시 제출하기"}
              </button>
            )}

            {/* 다른 문제 풀기 링크 */}
            <Link
              href="/problems"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowRight className="w-5 h-5" />
              다른 문제 풀기
            </Link>
          </div>

          {/* SUCCESS 상태에서 추가 안내 */}
          {submission.status === "SUCCESS" && submission.score !== undefined && submission.score < 100 && (
            <p className="mt-4 text-sm text-gray-600 text-center">
              더 많은 엣지 케이스를 찾아 점수를 높여보세요!
            </p>
          )}
        </div>
      )}

      {/* Execution Log (optional, collapsed by default) */}
      {submission.execution_log && submission.status !== "FAILURE" && (
        <details className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            실행 로그 보기 (디버깅용)
          </summary>
          <div className="mt-3 bg-white rounded p-3 border border-gray-200">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto font-mono">
              {JSON.stringify(submission.execution_log, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

