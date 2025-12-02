/** Problem detail page */

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Code2, FileText, ChevronDown } from "lucide-react";
import { getProblem } from "@/lib/api/problems";
import { createSubmission, getSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api";
import type { Problem, Submission } from "@/types/problem";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CodeEditor from "@/components/CodeEditor";
import SubmissionResultPanel from "@/components/SubmissionResultPanel";
import ProblemDescription from "@/components/ProblemDescription";
import Link from "next/link";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = parseInt(params.id as string);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const pollingErrorCountRef = useRef<number>(0);

  // Generate initial test template
  const getInitialTemplate = (problem: Problem): string => {
    // Extract function name from signature (e.g., "def sum_list(values: list[int]) -> int:" -> "sum_list")
    const functionNameMatch = problem.function_signature.match(/def\s+(\w+)/);
    const functionName = functionNameMatch ? functionNameMatch[1] : "function";
    
    return `import pytest
from target import ${functionName}

# TODO: 테스트 케이스를 작성하세요.
`;
  };

  useEffect(() => {
    const fetchProblem = async () => {
      if (isNaN(problemId)) {
        setError("잘못된 문제 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProblem(problemId);
        setProblem(result);
        // Set initial template
        setCode(getInitialTemplate(result));
      } catch (err: unknown) {
        let errorMessage = "문제를 불러오는데 실패했습니다.";
        if (err instanceof ApiError) {
          const errorData = err.data as { detail?: string } | undefined;
          errorMessage = errorData?.detail || err.message;
        } else if (err && typeof err === "object" && "message" in err) {
          errorMessage = String(err.message);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Polling for submission result
  useEffect(() => {
    // 폴링이 필요 없는 상태면 정리
    if (!submission || (submission.status !== "PENDING" && submission.status !== "RUNNING")) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      pollingStartTimeRef.current = null;
      pollingErrorCountRef.current = 0;
      return;
    }

    // 폴링 시작 시간 기록
    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
      pollingErrorCountRef.current = 0;
    }

    // 타임아웃 설정 (5분)
    const POLLING_TIMEOUT = 5 * 60 * 1000; // 5분
    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setSubmissionError(
        "채점이 5분 이상 지연되고 있습니다. 서버에 문제가 있을 수 있습니다. 잠시 후 다시 시도해주세요."
      );
      pollingStartTimeRef.current = null;
    }, POLLING_TIMEOUT);

    // 폴링 시작
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedSubmission = await getSubmission(submission.id);
        setSubmission(updatedSubmission);
        // 성공 시 에러 카운트 리셋
        pollingErrorCountRef.current = 0;
      } catch (err) {
        pollingErrorCountRef.current += 1;
        console.error("Failed to fetch submission:", err);
        
        // 연속 에러가 5회 이상이면 사용자에게 알림
        if (pollingErrorCountRef.current >= 5) {
          let errorMessage = "채점 결과를 가져오는 중 오류가 발생했습니다.";
          if (err instanceof ApiError) {
            const errorData = err.data as { detail?: string } | undefined;
            errorMessage = errorData?.detail || err.message || errorMessage;
          } else if (err && typeof err === "object" && "message" in err) {
            errorMessage = String(err.message);
          }
          setSubmissionError(errorMessage);
          
          // 폴링 중지
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [submission]);

  const handleSubmit = async () => {
    if (!problem) return;

    if (!code.trim()) {
      setSubmissionError("코드를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionError(null);
      // 이전 폴링 상태 초기화
      pollingStartTimeRef.current = null;
      pollingErrorCountRef.current = 0;
      
      const newSubmission = await createSubmission({
        problem_id: problem.id,
        code: code.trim(),
      });
      setSubmission(newSubmission);
    } catch (err: unknown) {
      let errorMessage = "제출에 실패했습니다.";
      if (err instanceof ApiError) {
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setSubmissionError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToEditor = () => {
    const editorElement = document.getElementById("code-editor");
    if (editorElement) {
      editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} />
        <div className="mt-4">
          <Link
            href="/problems"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← 문제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  const difficultyColors = {
    Easy: "bg-green-100 text-green-800 border-green-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Hard: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/problems"
          className="text-blue-600 hover:text-blue-800 transition-colors mb-4 inline-block"
        >
          ← 문제 목록으로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header with Title */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {problem.title || `문제 #${problem.id}`}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ID: {problem.id}</span>
                {problem.slug && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="font-mono text-xs">{problem.slug}</span>
                  </>
                )}
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border shrink-0 ${
                difficultyColors[problem.difficulty]
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
          
          {/* Tags */}
          {problem.skills && problem.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {problem.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-50 text-gray-700 rounded-md text-xs border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Function Signature */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4" />
            함수 시그니처
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <code className="text-gray-800 font-mono text-sm">
              {problem.function_signature}
            </code>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              문제 설명
            </h2>
            <button
              onClick={scrollToEditor}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              테스트 코드 작성하러 내려가기
            </button>
          </div>
          <ProblemDescription description_md={problem.description_md} />
        </div>

        {/* Golden Code (for reference, hidden by default) */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            정답 코드 보기 (참고용)
          </summary>
          <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-gray-800 font-mono overflow-x-auto">
              <code>{problem.golden_code}</code>
            </pre>
          </div>
        </details>
      </div>

      {/* Code Editor and Submission */}
      <div id="code-editor" className="mt-8 bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          테스트 코드 작성
        </h2>

        <div className="mb-4">
          <CodeEditor
            value={code}
            onChange={(value) => setCode(value || "")}
            height="300px"
            language="python"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {submitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {submitting ? "제출 중..." : "채점하기"}
        </button>
      </div>

      {/* Submission Result - Always rendered in the same location */}
      <SubmissionResultPanel
        submission={submission}
        isSubmitting={submitting}
        submissionError={submissionError}
        onRetry={handleSubmit}
      />
    </div>
  );
}

