'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AIChallengeListItem, AIChallengeListResponse } from '@/types/ai-verifier';
import { get } from '@/lib/api';

const LEVEL_INFO: Record<number, { name: string; description: string; color: string }> = {
  1: { name: 'Level 1', description: '기초 로직 버그 - 간단한 조건문 오류를 찾아보세요', color: 'from-green-500 to-green-600' },
  2: { name: 'Level 2', description: '조건문 함정 - 숨겨진 조건 오류를 발견하세요', color: 'from-green-600 to-green-700' },
  3: { name: 'Level 3', description: '경계값 분석 - 경계 조건에서 발생하는 버그를 찾으세요', color: 'from-yellow-500 to-yellow-600' },
  4: { name: 'Level 4', description: '고급 경계값 - 복잡한 경계 조건을 분석하세요', color: 'from-yellow-600 to-orange-500' },
  5: { name: 'Level 5', description: '타입 혼동 - 타입 관련 버그를 탐지하세요', color: 'from-orange-500 to-red-500' },
};

export default function LevelPage() {
  const params = useParams();
  const level = parseInt(params.level as string, 10);
  const [challenges, setChallenges] = useState<AIChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const levelInfo = LEVEL_INFO[level] || {
    name: `Level ${level}`,
    description: '새로운 도전이 기다리고 있습니다',
    color: 'from-purple-500 to-purple-600',
  };

  useEffect(() => {
    async function fetchChallenges() {
      setLoading(true);
      try {
        const data = await get<AIChallengeListResponse>(
          `/v1/ai-verifier/challenges?level=${level}&page=${page}&page_size=10`
        );
        setChallenges(data.challenges);
        setTotalPages(data.total_pages);
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setLoading(false);
      }
    }

    if (level) {
      fetchChallenges();
    }
  }, [level, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/ai-verifier" className="text-gray-400 hover:text-white mb-4 inline-block">
          ← 트랙 홈으로
        </Link>
        <div className={`bg-gradient-to-r ${levelInfo.color} rounded-xl p-8 text-white`}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{levelInfo.name}</h1>
          <p className="text-lg opacity-90">{levelInfo.description}</p>
        </div>
      </div>

      {/* Challenge List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">아직 이 레벨에 챌린지가 없습니다.</p>
          <p className="text-gray-500 mt-2">곧 새로운 문제가 추가될 예정입니다!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge, index) => (
            <Link
              key={challenge.id}
              href={`/ai-verifier/challenge/${challenge.id}`}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                    {challenge.is_completed ? '✅' : `${index + 1}`}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-1">{challenge.title}</h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                        {challenge.category}
                      </span>
                      <span className="text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                        {challenge.bug_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">{challenge.bounty_points} pts</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                    challenge.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                    challenge.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
