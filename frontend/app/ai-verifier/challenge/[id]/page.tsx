'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { editor } from 'monaco-editor';
import { AIChallenge } from '@/types/ai-verifier';
import { VerifierEditor } from '@/components/ai-verifier/VerifierEditor';
import { useEditorAction } from '@/hooks/ai-verifier/useEditorAction';

/**
 * AI Verifier Challenge Page
 *
 * M2: Monaco Editor 통합 완료
 * - M3: AI Chat interface (ChatPanel component) - TODO
 * - M4: Judge Engine integration (TestCaseInput, JudgeResult components) - TODO
 */
export default function ChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<AIChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monaco Editor 상태
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [previousCode, setPreviousCode] = useState<string | undefined>(undefined);

  // useEditorAction 훅으로 Undo 스택 보존 적용
  const { applyCode, undoLastApply, lastApply } = useEditorAction(editorRef);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch(`/api/v1/ai-verifier/challenges/${challengeId}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError('챌린지를 찾을 수 없습니다.');
          } else {
            setError('챌린지를 불러오는데 실패했습니다.');
          }
          return;
        }
        const data: AIChallenge = await res.json();
        setChallenge(data);
        // 초기 코드 설정
        setCurrentCode(data.buggy_code_template);
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  // 에디터 준비 완료 핸들러
  const handleEditorReady = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  // AI가 새 코드를 제안할 때 호출되는 함수 (M3에서 사용)
  const handleApplyAICode = (newCode: string) => {
    setPreviousCode(currentCode);
    setCurrentCode(newCode);
    applyCode(newCode);
  };

  // 되돌리기 핸들러
  const handleUndo = () => {
    undoLastApply();
    if (lastApply) {
      setCurrentCode(lastApply.beforeCode);
      setPreviousCode(undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-400 text-xl mb-4">{error || '챌린지를 찾을 수 없습니다.'}</p>
          <Link href="/ai-verifier" className="text-blue-400 hover:underline">
            트랙 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/ai-verifier/${challenge.level}`} className="text-gray-400 hover:text-white">
              ← Level {challenge.level}
            </Link>
            <h1 className="text-xl font-bold text-white">{challenge.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-bold">{challenge.bounty_points} pts</span>
            <span className={`px-2 py-1 rounded text-sm ${
              challenge.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
              challenge.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {challenge.difficulty}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - 2-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat (Placeholder) */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col bg-gray-900">
          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-bold text-white mb-2">미션</h2>
              <p className="text-gray-300">{challenge.description}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium text-white mb-2">함수 정보</h3>
              <p className="text-gray-400 text-sm">
                함수명: <code className="bg-gray-700 px-1 rounded">{challenge.function_name}</code>
              </p>
              <p className="text-gray-400 text-sm mt-1">
                버그 유형: <span className="text-orange-400">{challenge.bug_type}</span>
              </p>
            </div>

            {/* Chat Panel Placeholder */}
            <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-500">
              <p className="mb-2">💬 AI Chat Panel</p>
              <p className="text-sm">(M3에서 구현 예정)</p>
            </div>
          </div>

          {/* Chat Input Placeholder */}
          <div className="p-4 border-t border-gray-700">
            <input
              type="text"
              placeholder="AI에게 코드를 요청하세요..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
              disabled
            />
          </div>
        </div>

        {/* Right Panel - Editor & Test */}
        <div className="w-1/2 flex flex-col bg-gray-900">
          {/* Code Editor - VerifierEditor */}
          <div className="flex-1 p-4 overflow-hidden">
            <VerifierEditor
              code={currentCode}
              previousCode={previousCode}
              readOnly={true}
              onEditorReady={handleEditorReady}
              onUndo={previousCode ? handleUndo : undefined}
              height="100%"
            />
          </div>

          {/* Test Input Placeholder */}
          <div className="p-4 border-t border-gray-700">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">테스트 입력</h3>
              <p className="text-gray-500 text-sm mb-3">{challenge.input_hint}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="테스트할 입력값을 입력하세요..."
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  disabled
                />
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded opacity-50 cursor-not-allowed"
                  disabled
                >
                  실행 & 검증
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">(M4에서 구현 예정)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
