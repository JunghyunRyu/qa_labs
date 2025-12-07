/** Score display component */

import { Trophy, Target, TrendingUp } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  killedMutants?: number;
  totalMutants?: number;
}

export default function ScoreDisplay({
  score,
  killedMutants,
  totalMutants,
}: ScoreDisplayProps) {
  const killRatio =
    killedMutants !== undefined && totalMutants !== undefined && totalMutants > 0
      ? (killedMutants / totalMutants) * 100
      : null;

  // 점수에 따른 색상 및 등급 결정
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "우수";
    if (score >= 70) return "양호";
    if (score >= 50) return "보통";
    return "미흡";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-blue-50 border-blue-200";
    if (score >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const scoreColor = getScoreColor(score);
  const scoreGrade = getScoreGrade(score);
  const scoreBgColor = getScoreBgColor(score);

  return (
    <div className="space-y-6">
      {/* 메인 점수 표시 */}
      <div className={`rounded-lg border-2 p-6 ${scoreBgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className={`w-8 h-8 ${scoreColor}`} />
            <div>
              <div className="text-sm font-medium text-gray-600">총점</div>
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-sm text-gray-500 mt-1">/ 100점</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">등급</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>{scoreGrade}</div>
          </div>
        </div>

        {/* 점수 구성 설명 */}
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-600">기본 점수: 30점</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-600">Mutant Kill: {score - 30}점</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mutant Kill Ratio */}
      {killRatio !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">
              Mutant Kill Ratio
            </h4>
          </div>
          
          <div className="space-y-3">
            {/* 진행 바 */}
            <div className="relative">
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                    killRatio >= 80
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : killRatio >= 50
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                      : "bg-gradient-to-r from-red-400 to-red-600"
                  }`}
                  style={{ width: `${killRatio}%` }}
                >
                  {killRatio > 15 && (
                    <span className="text-xs font-bold text-white">
                      {killRatio.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {killRatio <= 15 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {killRatio.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Kill된 Mutant: <span className="font-semibold text-gray-900">{killedMutants}</span>
                </span>
              </div>
              <span className="text-gray-500">
                전체: <span className="font-semibold">{totalMutants}</span>
              </span>
            </div>

            {/* 성과 평가 */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {killRatio >= 80
                  ? "🎉 훌륭합니다! 대부분의 버그를 찾아냈습니다."
                  : killRatio >= 50
                  ? "👍 좋은 시작입니다. 더 많은 테스트 케이스를 추가해보세요."
                  : "💪 더 많은 엣지 케이스를 고려해보세요."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

