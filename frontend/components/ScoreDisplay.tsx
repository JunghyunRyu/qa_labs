/** Score display component */

import { Trophy, Target, TrendingUp, Shield, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  killedMutants?: number;
  totalMutants?: number;
  // Client Result Verification (P0 Security)
  executionMode?: "client" | "server";
  verified?: boolean;
  verificationStatus?: "pending" | "verified" | "mismatch";
}

export default function ScoreDisplay({
  score,
  killedMutants,
  totalMutants,
  executionMode = "client",
  verified = false,
  verificationStatus,
}: ScoreDisplayProps) {
  const killRatio =
    killedMutants !== undefined && totalMutants !== undefined && totalMutants > 0
      ? (killedMutants / totalMutants) * 100
      : null;

  // 점수에 따른 색상 및 등급 결정 - Linear 스타일: 톤다운
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-neutral-700 dark:text-neutral-300";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "우수";
    if (score >= 70) return "양호";
    if (score >= 50) return "보통";
    return "미흡";
  };

  // Linear 스타일: 미묘한 배경색
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-emerald-50/50 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/50";
    if (score >= 70) return "bg-neutral-50/50 border-neutral-200/60 dark:bg-neutral-900/30 dark:border-neutral-700/50";
    if (score >= 50) return "bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/50";
    return "bg-red-50/50 border-red-200/60 dark:bg-red-950/20 dark:border-red-800/50";
  };

  const scoreColor = getScoreColor(score);
  const scoreGrade = getScoreGrade(score);
  const scoreBgColor = getScoreBgColor(score);

  // 검증 상태 배지 렌더링 - Linear 스타일: 톤다운
  const renderVerificationBadge = () => {
    // 서버 실행은 기본적으로 신뢰
    if (executionMode === "server") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          서버 실행 결과
        </span>
      );
    }

    // 클라이언트 실행 검증 상태
    if (verificationStatus === "verified" || verified) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          서버 검증 완료
        </span>
      );
    }

    if (verificationStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          <Loader2 className="w-3 h-3 animate-spin" />
          검증 중...
        </span>
      );
    }

    if (verificationStatus === "mismatch") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50/80 text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <ShieldAlert className="w-3 h-3" />
          점수 확정 보류
        </span>
      );
    }

    // 기본: 클라이언트 실행, 미검증
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
        title="브라우저에서 실행된 결과입니다"
      >
        <Shield className="w-3 h-3" />
        로컬 실행 결과
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 베타 라벨 및 검증 상태 */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
          학습용 지표 (베타)
        </span>
        {renderVerificationBadge()}
      </div>

      {/* 메인 점수 표시 */}
      <div className={`rounded-lg border-2 p-6 ${scoreBgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className={`w-8 h-8 ${scoreColor}`} />
            <div>
              <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">총점</div>
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">/ 100점</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">등급</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>{scoreGrade}</div>
          </div>
        </div>

        {/* 점수 구성 설명 */}
        <div className="mt-4 pt-4 border-t border-neutral-300 dark:border-neutral-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-neutral-400 rounded-full"></div>
              <span className="text-neutral-600 dark:text-neutral-400">기본 점수: 30점</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-neutral-600 dark:text-neutral-400">버그 탐지: {score - 30}점</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mutant Kill Ratio - Linear 스타일 */}
      {killRatio !== null && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300" title="Mutation Kill Rate - 테스트가 버그를 발견한 비율">
              버그 탐지율
            </h4>
          </div>

          <div className="space-y-3">
            {/* 진행 바 - 톤다운된 그라데이션 */}
            <div className="relative">
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                    killRatio >= 80
                      ? "bg-emerald-500 dark:bg-emerald-600"
                      : killRatio >= 50
                      ? "bg-amber-500 dark:bg-amber-600"
                      : "bg-red-500 dark:bg-red-600"
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
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {killRatio.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neutral-500 dark:text-neutral-500" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  발견된 버그: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{killedMutants}건</span>
                </span>
              </div>
              <span className="text-neutral-500 dark:text-neutral-500">
                전체: <span className="font-semibold">{totalMutants}건</span>
              </span>
            </div>

            {/* 성과 평가 */}
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                {killRatio >= 80
                  ? "훌륭합니다! 대부분의 버그를 찾아냈습니다."
                  : killRatio >= 50
                  ? "좋은 시작입니다. 더 많은 테스트 케이스를 추가해보세요."
                  : "더 많은 엣지 케이스를 고려해보세요."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

