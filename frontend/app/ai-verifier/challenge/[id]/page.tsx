'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { editor } from 'monaco-editor';
import { AIChallenge } from '@/types/ai-verifier';
import { VerifierEditor } from '@/components/ai-verifier/VerifierEditor';
import { ChatPanel } from '@/components/ai-verifier/ChatPanel';
import { TestCaseInput, JudgeResultDisplay } from '@/components/ai-verifier/JudgePanel';
import { useEditorAction } from '@/hooks/ai-verifier/useEditorAction';
import { useJudge } from '@/hooks/ai-verifier/useJudge';

/**
 * AI Verifier Challenge Page
 *
 * M2: Monaco Editor 통합 완료
 * M3: AI Chat Interface 통합 완료
 * M4: Judge Engine 통합 완료
 * - M5: Content and Level System - TODO
 */
export default function ChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<AIChallenge | null>(null);
  const [correctCode, setCorrectCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monaco Editor 상태
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [previousCode, setPreviousCode] = useState<string | undefined>(undefined);

  // useEditorAction 훅으로 Undo 스택 보존 적용
  const { applyCode, undoLastApply, lastApply } = useEditorAction(editorRef);

  // Judge Engine 훅 (challenge 로드 후 초기화)
  const judgeOptions = challenge ? {
    functionName: challenge.function_name,
    expectedOutputType: challenge.expected_output_type || 'any',
    comparisonConfig: challenge.comparison_config || {},
  } : {
    functionName: '',
    expectedOutputType: 'any',
  };

  const { judge, result: judgeResult, isJudging, isPyodideLoading } = useJudge(judgeOptions);

  // 테스트 실행 핸들러
  const handleTestSubmit = async (userInput: string) => {
    if (!challenge || !correctCode) return;

    // 현재 에디터의 코드 (버그 코드)와 서버에서 가져온 정답 코드로 비교
    await judge(userInput, currentCode, correctCode);
  };

  useEffect(() => {
    async function fetchChallenge() {
      try {
        // Fetch challenge and judge code in parallel
        const [challengeRes, judgeCodeRes] = await Promise.all([
          fetch(`/api/v1/ai-verifier/challenges/${challengeId}`, {
            credentials: 'include',
          }),
          fetch(`/api/v1/ai-verifier/challenges/${challengeId}/judge-code`, {
            credentials: 'include',
          }),
        ]);

        if (!challengeRes.ok) {
          if (challengeRes.status === 404) {
            setError('챌린지를 찾을 수 없습니다.');
          } else {
            setError('챌린지를 불러오는데 실패했습니다.');
          }
          return;
        }

        const data: AIChallenge = await challengeRes.json();
        setChallenge(data);
        // 초기 코드 설정
        setCurrentCode(data.buggy_code_template);

        // Judge code 설정
        if (judgeCodeRes.ok) {
          const judgeData = await judgeCodeRes.json();
          setCorrectCode(judgeData.correct_code);
        }
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
        {/* Left Panel - Chat */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col bg-gray-900">
          <ChatPanel
            challengeId={challengeId}
            challengeLevel={challenge.level}
            onApplyCode={handleApplyAICode}
            missionDescription={challenge.description}
            functionName={challenge.function_name}
            bugType={challenge.bug_type}
          />
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

          {/* Judge Result Display */}
          <JudgeResultDisplay result={judgeResult} />

          {/* Test Case Input */}
          <TestCaseInput
            onSubmit={handleTestSubmit}
            isLoading={isJudging || isPyodideLoading}
            inputHint={challenge.input_hint}
            disabled={!currentCode || !correctCode}
          />
        </div>
      </div>
    </div>
  );
}
