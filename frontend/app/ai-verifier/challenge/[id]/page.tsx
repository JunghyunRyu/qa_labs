'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { editor } from 'monaco-editor';
import { AIChallenge, NewBadge, NewRank } from '@/types/ai-verifier';
import { VerifierEditor } from '@/components/ai-verifier/VerifierEditor';
import { ChatPanel } from '@/components/ai-verifier/ChatPanel';
import { TestCaseInput, JudgeResultDisplay } from '@/components/ai-verifier/JudgePanel';
import { BadgeEarned, RankUpModal, ScoreDisplay } from '@/components/ai-verifier/Gamification';
import { OnboardingTutorial, useOnboarding } from '@/components/ai-verifier/Onboarding';
import { useEditorAction } from '@/hooks/ai-verifier/useEditorAction';
import { useJudge } from '@/hooks/ai-verifier/useJudge';
import { usePyodideStore } from '@/stores/pyodideStore';
import {
  trackAIVerifierChallengeView,
  trackAIVerifierBugFound,
  trackAIVerifierBugNotFound,
  trackAIVerifierBadgeEarned,
  trackAIVerifierRankUp,
  trackAIVerifierOnboardingStep,
  trackAIVerifierOnboardingSkip,
  trackAIVerifierCodeApplied,
  trackAIVerifierTestSubmitted,
} from '@/lib/analytics';
import { get, post } from '@/lib/api';

/**
 * AI Verifier Challenge Page
 *
 * M2: Monaco Editor 통합 완료
 * M3: AI Chat Interface 통합 완료
 * M4: Judge Engine 통합 완료
 * M5: Content and Level System 완료
 * M6: Gamification 완료
 */
export default function ChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const [challenge, setChallenge] = useState<AIChallenge | null>(null);
  const [correctCode, setCorrectCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Onboarding
  const {
    showOnboarding,
    onboardingType,
    completeOnboarding,
    skipOnboarding,
    recordFailure,
    recordSuccess,
  } = useOnboarding();

  // Track time spent for analytics
  const startTimeRef = useRef<number>(Date.now());
  const attemptCountRef = useRef<number>(0);

  // Gamification state
  const [totalScore, setTotalScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [rank, setRank] = useState({ name: 'Rookie', icon: '🔰' });
  const [newRank, setNewRank] = useState<NewRank | null>(null);
  const [earnedBadge, setEarnedBadge] = useState<NewBadge | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<NewBadge[]>([]);

  // Monaco Editor 상태
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [previousCode, setPreviousCode] = useState<string | undefined>(undefined);

  // useEditorAction 훅으로 Undo 스택 보존 적용
  const { applyCode, undoLastApply, lastApply } = useEditorAction(editorRef);

  // Pyodide 미리 초기화 (페이지 로드 시)
  const initializePyodide = usePyodideStore((state) => state.initialize);
  const isPyodideInitialized = usePyodideStore((state) => state._isInitialized);
  const isPyodideInitializing = usePyodideStore((state) => state._isInitializing);

  useEffect(() => {
    // 페이지 마운트 시 Pyodide 미리 초기화
    if (!isPyodideInitialized && !isPyodideInitializing) {
      initializePyodide().catch((err) => {
        console.error('Failed to preload Pyodide:', err);
      });
    }
  }, [initializePyodide, isPyodideInitialized, isPyodideInitializing]);

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

  // Process badge queue and track analytics
  useEffect(() => {
    if (badgeQueue.length > 0 && !earnedBadge) {
      const [next, ...rest] = badgeQueue;
      setEarnedBadge(next);
      setBadgeQueue(rest);
      // Track badge earned
      trackAIVerifierBadgeEarned({
        badgeId: next.id,
        badgeName: next.name,
      });
    }
  }, [badgeQueue, earnedBadge]);

  // Record attempt to server and handle gamification
  const recordAttempt = useCallback(async (userInput: string, bugFound: boolean) => {
    attemptCountRef.current += 1;
    const timeSpentSec = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Track bug found/not found analytics
    if (bugFound && challenge) {
      trackAIVerifierBugFound({
        challengeId,
        level: challenge.level,
        attempts: attemptCountRef.current,
        timeSpentSec,
      });
      recordSuccess();
    } else {
      trackAIVerifierBugNotFound({
        challengeId,
        attempts: attemptCountRef.current,
      });
      recordFailure();
    }

    try {
      const result = await post<{
        points_earned: number;
        total_score: number;
        new_rank?: NewRank;
        newly_awarded_badges?: NewBadge[];
      }>(`/v1/ai-verifier/challenges/${challengeId}/attempt`, {
        user_input: userInput,
        bug_found: bugFound,
      });

      // Update gamification state
      if (result.points_earned > 0) {
        setPointsEarned(result.points_earned);
        setTotalScore(result.total_score);
        // Clear points animation after 3 seconds
        setTimeout(() => setPointsEarned(0), 3000);
      }

      // Handle rank up
      if (result.new_rank) {
        setNewRank(result.new_rank);
        setRank(result.new_rank);
        // Track rank up analytics
        trackAIVerifierRankUp({
          oldRank: rank.name,
          newRank: result.new_rank.name,
          totalScore: result.total_score,
        });
      }

      // Handle badges (queue them for sequential display)
      if (result.newly_awarded_badges?.length && result.newly_awarded_badges.length > 0) {
        setBadgeQueue((prev) => [...prev, ...result.newly_awarded_badges!]);
      }
    } catch (err) {
      console.error('Failed to record attempt:', err);
    }
  }, [challengeId, challenge, rank.name, recordSuccess, recordFailure]);

  // 테스트 실행 핸들러
  const handleTestSubmit = async (userInput: string) => {
    if (!challenge || !correctCode) return;

    // Track test submission
    trackAIVerifierTestSubmitted({
      challengeId,
      inputType: userInput.includes(',') ? 'multiple' : 'single',
    });

    // 현재 에디터의 코드 (버그 코드)와 서버에서 가져온 정답 코드로 비교
    const result = await judge(userInput, currentCode, correctCode);

    // Record attempt to server for gamification
    if (result) {
      await recordAttempt(userInput, result.bugFound);
    }
  };

  useEffect(() => {
    async function fetchChallenge() {
      try {
        // Fetch challenge and judge code in parallel
        const [data, judgeData] = await Promise.all([
          get<AIChallenge>(`/v1/ai-verifier/challenges/${challengeId}`),
          get<{ correct_code: string }>(`/v1/ai-verifier/challenges/${challengeId}/judge-code`),
        ]);

        setChallenge(data);
        // 초기 코드 설정
        setCurrentCode(data.buggy_code_template);

        // Track challenge view
        trackAIVerifierChallengeView({
          challengeId,
          level: data.level,
          category: data.category,
        });

        // Reset timer for this challenge
        startTimeRef.current = Date.now();
        attemptCountRef.current = 0;

        // Judge code 설정
        setCorrectCode(judgeData.correct_code);
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
        if (err instanceof Error && err.message.includes('404')) {
          setError('챌린지를 찾을 수 없습니다.');
        } else {
          setError('네트워크 오류가 발생했습니다.');
        }
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
  const handleApplyAICode = (newCode: string, isPrescripted = false) => {
    setPreviousCode(currentCode);
    setCurrentCode(newCode);
    applyCode(newCode);
    // Track code application
    trackAIVerifierCodeApplied({
      challengeId,
      isPrescripted,
    });
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

  // Onboarding handlers with analytics
  const handleOnboardingComplete = () => {
    completeOnboarding();
    trackAIVerifierOnboardingStep({
      stepNumber: 5,
      stepName: 'complete',
    });
  };

  const handleOnboardingSkip = () => {
    trackAIVerifierOnboardingSkip({ skippedAtStep: 1 });
    skipOnboarding();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Onboarding Tutorial */}
      {showOnboarding && onboardingType === 'full' && (
        <OnboardingTutorial
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Gamification Modals */}
      <BadgeEarned badge={earnedBadge} onClose={() => setEarnedBadge(null)} />
      <RankUpModal rank={newRank} onClose={() => setNewRank(null)} />

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
            {/* Score Display */}
            <ScoreDisplay
              score={totalScore}
              pointsEarned={pointsEarned}
              rank={rank}
              compact
            />
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
