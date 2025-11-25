/** Problem detail page */

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getProblem } from "@/lib/api/problems";
import { createSubmission, getSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api";
import type { Problem, Submission } from "@/types/problem";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CodeEditor from "@/components/CodeEditor";
import SubmissionResult from "@/components/SubmissionResult";
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
    if (!submission || (submission.status !== "PENDING" && submission.status !== "RUNNING")) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedSubmission = await getSubmission(submission.id);
        setSubmission(updatedSubmission);
      } catch (err) {
        console.error("Failed to fetch submission:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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
    Easy: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Hard: "bg-red-100 text-red-800",
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
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {problem.title}
            </h1>
            <p className="text-gray-600 text-sm">ID: {problem.id}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              difficultyColors[problem.difficulty]
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        {/* Skills */}
        {problem.skills && problem.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Function Signature */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            문제 설명
          </h2>
          <div className="prose max-w-none text-gray-700">
            <ReactMarkdown>{problem.description_md}</ReactMarkdown>
          </div>
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
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
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

        {submissionError && (
          <div className="mb-4">
            <Error message={submissionError} />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? "제출 중..." : "채점하기"}
        </button>
      </div>

      {/* Submission Result */}
      {submission && (
        <div className="mt-8">
          <SubmissionResult submission={submission} />
        </div>
      )}
    </div>
  );
}

