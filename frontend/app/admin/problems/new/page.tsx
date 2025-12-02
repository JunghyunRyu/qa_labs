/** Admin - AI Problem Generation Page */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateProblem, createProblem } from "@/lib/api/admin";
import { ApiError } from "@/lib/api";
import type { ProblemGenerateRequest, GeneratedProblem } from "@/lib/api/admin";
import CodeEditor from "@/components/CodeEditor";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AdminProblemNewPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [skillsToAssess, setSkillsToAssess] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [generating, setGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<GeneratedProblem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("문제 목표를 입력해주세요.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const skills = skillsToAssess
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const result = await generateProblem({
        goal: goal.trim(),
        language: "python",
        testing_framework: "pytest",
        skills_to_assess: skills,
        difficulty,
      });

      setGeneratedProblem(result);
      // 기본 slug와 title 생성
      const defaultSlug = result.function_signature
        .match(/def\s+(\w+)/)?.[1] || "problem";
      setSlug(defaultSlug);
      // AI가 생성한 title이 있으면 사용, 없으면 함수 시그니처에서 추출
      setTitle(result.title || result.function_signature.replace("def ", "").replace(":", ""));
    } catch (err: unknown) {
      let errorMessage = "문제 생성에 실패했습니다.";
      if (err instanceof ApiError) {
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedProblem || !slug.trim() || !title.trim()) {
      setError("Slug와 제목을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createProblem({
        slug: slug.trim(),
        title: title.trim(),
        description_md: generatedProblem.description_md,
        function_signature: generatedProblem.function_signature,
        golden_code: generatedProblem.golden_code,
        difficulty: generatedProblem.difficulty,
        skills: generatedProblem.tags,
        buggy_implementations: generatedProblem.buggy_implementations.map((bi) => ({
          buggy_code: bi.buggy_code,
          bug_description: bi.bug_description,
          weight: bi.weight,
        })),
      });

      router.push("/admin/problems");
    } catch (err: unknown) {
      let errorMessage = "문제 저장에 실패했습니다.";
      if (err instanceof ApiError) {
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/problems"
          className="text-blue-600 hover:text-blue-800 transition-colors mb-4 inline-block"
        >
          ← Admin 문제 목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">AI 문제 생성</h1>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">문제 생성 요청</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 목표 *
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="예: 경계값 분석을 평가하는 QA 코딩 테스트 문제 생성"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              평가할 기술 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={skillsToAssess}
              onChange={(e) => setSkillsToAssess(e.target.value)}
              placeholder="예: boundary value analysis, negative input handling"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              난이도
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {error && (
            <div>
              <Error message={error} />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !goal.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {generating ? "생성 중..." : "AI로 생성"}
          </button>
        </div>
      </div>

      {/* Generated Problem Preview */}
      {generating && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <Loading />
        </div>
      )}

      {generatedProblem && !generating && (
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">생성된 문제 미리보기</h2>

          {/* Problem Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="problem-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="문제 제목"
              />
            </div>
          </div>

          {/* Function Signature */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">함수 시그니처</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <code className="text-gray-800 font-mono text-sm">
                {generatedProblem.function_signature}
              </code>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">문제 설명</h3>
            <div className="prose max-w-none text-gray-700 border border-gray-200 rounded-lg p-4">
              <ReactMarkdown>{generatedProblem.description_md}</ReactMarkdown>
            </div>
          </div>

          {/* Golden Code */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Golden Code</h3>
            <CodeEditor
              value={generatedProblem.golden_code}
              readOnly
              height="200px"
              language="python"
            />
          </div>

          {/* Buggy Implementations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Buggy Implementations ({generatedProblem.buggy_implementations.length}개)
            </h3>
            <div className="space-y-4">
              {generatedProblem.buggy_implementations.map((bi, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {bi.bug_description || `Bug ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500">Weight: {bi.weight}</span>
                  </div>
                  <CodeEditor
                    value={bi.buggy_code}
                    readOnly
                    height="150px"
                    language="python"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !slug.trim() || !title.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? "저장 중..." : "문제 저장"}
            </button>
            <button
              onClick={() => {
                setGeneratedProblem(null);
                setGoal("");
                setSkillsToAssess("");
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              새로 생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

