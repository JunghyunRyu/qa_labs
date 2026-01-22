'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AIChallengeListItem, AIChallengeListResponse, AIVerifierStats } from '@/types/ai-verifier';
import { get } from '@/lib/api';

const LEVELS = [
  { level: 1, name: 'Level 1', description: '기초 로직 버그', color: 'from-green-500 to-green-600' },
  { level: 2, name: 'Level 2', description: '조건문 함정', color: 'from-green-600 to-green-700' },
  { level: 3, name: 'Level 3', description: '경계값 분석', color: 'from-yellow-500 to-yellow-600' },
  { level: 4, name: 'Level 4', description: '고급 경계값', color: 'from-yellow-600 to-orange-500' },
  { level: 5, name: 'Level 5', description: '타입 혼동', color: 'from-orange-500 to-red-500' },
];

const RANK_COLORS: Record<string, string> = {
  Rookie: 'text-gray-400',
  'Bug Hunter': 'text-green-400',
  'Code Detective': 'text-blue-400',
  'Senior Verifier': 'text-purple-400',
  'Master Auditor': 'text-yellow-400',
};

export default function AIVerifierHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<AIVerifierStats | null>(null);
  const [recentChallenges, setRecentChallenges] = useState<AIChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats (will return default for unauthenticated users)
        try {
          const statsData = await get<AIVerifierStats>('/v1/ai-verifier/stats');
          setStats(statsData);
        } catch {
          // Stats may fail for unauthenticated users
        }

        // Fetch recent challenges
        const data = await get<AIChallengeListResponse>('/v1/ai-verifier/challenges?page_size=5');
        setRecentChallenges(data.challenges);
      } catch (error) {
        console.error('Failed to fetch AI Verifier data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          🎯 AI Verifier Track
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          AI가 만든 코드의 버그를 찾아보세요!
          <br />
          코딩 없이 논리적 사고만으로 도전할 수 있습니다.
        </p>
      </div>

      {/* Stats Card (if authenticated) */}
      {stats && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{stats.rank_icon}</span>
              <div>
                <p className={`text-lg font-bold ${RANK_COLORS[stats.rank] || 'text-white'}`}>
                  {stats.rank}
                </p>
                <p className="text-gray-400 text-sm">총 {stats.total_score} 포인트</p>
              </div>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.bugs_found}</p>
                <p className="text-gray-400 text-sm">버그 발견</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.challenges_completed}</p>
                <p className="text-gray-400 text-sm">챌린지 완료</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">{stats.current_streak}</p>
                <p className="text-gray-400 text-sm">연속 기록</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">레벨 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {LEVELS.map((level) => (
            <Link
              key={level.level}
              href={`/ai-verifier/${level.level}`}
              className={`bg-gradient-to-br ${level.color} p-6 rounded-xl text-white hover:scale-105 transition-transform`}
            >
              <h3 className="text-xl font-bold mb-2">{level.name}</h3>
              <p className="text-sm opacity-90">{level.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Challenges */}
      {recentChallenges.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">최근 챌린지</h2>
          <div className="space-y-4">
            {recentChallenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/ai-verifier/challenge/${challenge.id}`}
                className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {challenge.is_completed ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">🎯</span>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-white">{challenge.title}</h3>
                      <p className="text-sm text-gray-400">
                        Level {challenge.level} • {challenge.category} • {challenge.bounty_points} pts
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    challenge.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                    challenge.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA for new users */}
      {!stats && !loading && (
        <div className="text-center mt-12">
          <Link
            href="/ai-verifier/1"
            className="inline-block px-8 py-4 bg-green-500 text-white rounded-xl text-lg font-bold hover:bg-green-400 transition-colors"
          >
            지금 시작하기
          </Link>
        </div>
      )}
    </div>
  );
}
