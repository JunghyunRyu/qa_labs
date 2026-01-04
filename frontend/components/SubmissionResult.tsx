/** Submission result display component */

import type { Submission } from "@/types/problem";
import SubmissionStatus from "./SubmissionStatus";
import ScoreDisplay from "./ScoreDisplay";
import FeedbackDisplay from "./FeedbackDisplay";
import TestResultsList from "./TestResultsList";
import ErrorLogDisplay from "./ErrorLogDisplay";
import { TestQualityPanel } from "./test-quality";
import { parsePytestOutput } from "@/lib/pytestParser";
import { AlertCircle, FileText, Sparkles, RefreshCw, ArrowRight, Lightbulb, Save, TrendingUp } from "lucide-react";
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

  // 게스트 사용자 여부
  const isGuest = !submission.user_id;

  return (
    <div className="space-y-6">
      {/* 게스트 사용자 결과 저장 유도 배너 - SUCCESS 상태에서만 표시 */}
      {isGuest && submission.status === "SUCCESS" && (
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-300/50 dark:border-purple-700/50 bg-gradient-to-r from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-neutral-900 dark:to-blue-950/30 p-5">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Save className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                이 결과를 저장하시겠어요?
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                로그인하면 <span className="font-medium text-purple-600 dark:text-purple-400">제출 이력</span>과
                <span className="font-medium text-purple-600 dark:text-purple-400"> AI 상세 피드백</span>,
                <span className="font-medium text-purple-600 dark:text-purple-400"> 성장 그래프</span>를
                확인할 수 있습니다.
              </p>
            </div>

            <a
              href="/api/v1/auth/github/login"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors font-medium text-sm shadow-sm"
            >
              <Github className="w-4 h-4" />
              결과 저장하기
            </a>
          </div>

          {/* 혜택 미리보기 */}
          <div className="relative mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/50 flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              실력 성장 추적
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              AI 맞춤 피드백
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              제출 이력 관리
            </span>
          </div>
        </div>
      )}

      {/* Status - Always shown */}
      <div className="bg-neutral-50/80 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">제출 상태</h3>
        </div>
        <SubmissionStatus status={submission.status} createdAt={submission.created_at} />
      </div>

      {/* Score - Always shown in the same location */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
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
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">테스트 실패 상세</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                테스트 실행에 실패했습니다
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                작성하신 테스트가 정답 코드를 통과시키지 못했습니다.
                테스트 코드를 확인해주세요.
              </p>
            </div>

            {/* 수정 가이드 */}
            <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">어떻게 수정할까요?</p>
                  <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1 list-disc list-inside">
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
                <summary className="cursor-pointer text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 mb-2">
                  에러 출력 보기
                </summary>
                <div className="mt-2 bg-white dark:bg-neutral-900 rounded p-3 border border-amber-200/60 dark:border-amber-800/50">
                  <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap overflow-x-auto font-mono">
                    {failureInfo.stderr}
                  </pre>
                </div>
              </details>
            )}

            {failureInfo.logs && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 mb-2">
                  실행 로그 보기
                </summary>
                <div className="mt-2 bg-white dark:bg-neutral-900 rounded p-3 border border-amber-200/60 dark:border-amber-800/50">
                  <pre className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap overflow-x-auto font-mono">
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
        <div className="bg-red-50/80 dark:bg-red-950/20 border-2 border-red-200/60 dark:border-red-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="text-lg font-semibold text-red-800 dark:text-red-200">채점 에러</h4>
          </div>
          <ErrorLogDisplay executionLog={submission.execution_log} />
        </div>
      )}

      {/* AI Feedback - Only shown for SUCCESS status */}
      {submission.status === "SUCCESS" && (
        <div className="bg-purple-50/80 dark:bg-purple-950/20 rounded-lg border border-purple-200/60 dark:border-purple-800/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">AI 피드백</h3>
          </div>
          {submission.feedback_json ? (
            // 피드백이 있는 경우 (회원 제출)
            <FeedbackDisplay feedback={submission.feedback_json as any} />
          ) : submission.user_id ? (
            // 회원인데 피드백이 없는 경우 (생성 중)
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mb-3"></div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                AI가 피드백을 생성하고 있습니다...
              </p>
            </div>
          ) : (
            // 게스트인 경우 로그인 유도 - 결과 소유욕 자극
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Sparkles className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {submission.score !== undefined && submission.score >= 75
                  ? "훌륭해요! AI가 더 높은 점수를 위한 힌트를 준비했어요"
                  : "AI가 놓친 케이스를 분석했어요"}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                어떤 테스트 케이스를 보강하면 좋을지, AI가 맞춤 피드백을 제공합니다.
              </p>
              <a
                href="/api/v1/auth/github/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium shadow-sm"
              >
                <Github className="w-5 h-5" />
                로그인하고 피드백 확인하기
              </a>
              <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                GitHub 계정으로 3초 만에 로그인
              </p>
            </div>
          )}
        </div>
      )}

      {/* CTA 버튼 섹션 - SUCCESS 또는 FAILURE 상태에서 표시 */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <div className="bg-neutral-50/80 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">다음 단계</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 다시 제출 버튼 */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                {submission.status === "FAILURE" ? "코드 수정 후 다시 제출" : "다시 제출하기"}
              </button>
            )}

            {/* 다른 문제 풀기 링크 */}
            <Link
              href="/problems"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              <ArrowRight className="w-5 h-5" />
              다른 문제 풀기
            </Link>
          </div>

          {/* SUCCESS 상태에서 추가 안내 */}
          {submission.status === "SUCCESS" && submission.score !== undefined && submission.score < 100 && (
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 text-center">
              더 많은 엣지 케이스를 찾아 점수를 높여보세요!
            </p>
          )}
        </div>
      )}

      {/* Execution Log (optional, collapsed by default) */}
      {submission.execution_log && submission.status !== "FAILURE" && (
        <details className="bg-neutral-50/80 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            실행 로그 보기 (디버깅용)
          </summary>
          <div className="mt-3 bg-white dark:bg-neutral-900 rounded p-3 border border-neutral-200 dark:border-neutral-700">
            <pre className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap overflow-x-auto font-mono">
              {JSON.stringify(submission.execution_log, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

