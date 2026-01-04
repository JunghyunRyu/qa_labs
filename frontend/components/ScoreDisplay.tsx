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

  // 점수에 따른 색상 및 등급 결정 - GitHub Dark 스타일
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#1a7f37] dark:text-[#3fb950]";
    if (score >= 70) return "text-[#24292f] dark:text-[#c9d1d9]";
    if (score >= 50) return "text-[#9a6700] dark:text-[#d29922]";
    return "text-[#cf222e] dark:text-[#f85149]";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "우수";
    if (score >= 70) return "양호";
    if (score >= 50) return "보통";
    return "미흡";
  };

  // GitHub Dark 스타일: 배경색
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-[#dafbe1]/50 border-[#aceebb] dark:bg-[#238636]/10 dark:border-[#238636]/40";
    if (score >= 70) return "bg-[#f6f8fa]/50 border-[#d0d7de] dark:bg-[#21262d]/30 dark:border-[#30363d]";
    if (score >= 50) return "bg-[#fff8c5]/50 border-[#fae17d] dark:bg-[#9e6a03]/10 dark:border-[#9e6a03]/40";
    return "bg-[#ffebe9]/50 border-[#ffc1ba] dark:bg-[#f85149]/10 dark:border-[#f85149]/40";
  };

  const scoreColor = getScoreColor(score);
  const scoreGrade = getScoreGrade(score);
  const scoreBgColor = getScoreBgColor(score);

  // 검증 상태 배지 렌더링 - GitHub Dark 스타일
  const renderVerificationBadge = () => {
    // 서버 실행은 기본적으로 신뢰
    if (executionMode === "server") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#dafbe1] text-[#1a7f37] dark:bg-[#238636]/20 dark:text-[#3fb950]">
          <ShieldCheck className="w-3 h-3" />
          서버 실행 결과
        </span>
      );
    }

    // 클라이언트 실행 검증 상태
    if (verificationStatus === "verified" || verified) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#dafbe1] text-[#1a7f37] dark:bg-[#238636]/20 dark:text-[#3fb950]">
          <ShieldCheck className="w-3 h-3" />
          서버 검증 완료
        </span>
      );
    }

    if (verificationStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f6f8fa] text-[#24292f] dark:bg-[#21262d] dark:text-[#c9d1d9]">
          <Loader2 className="w-3 h-3 animate-spin" />
          검증 중...
        </span>
      );
    }

    if (verificationStatus === "mismatch") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#ffebe9] text-[#cf222e] dark:bg-[#f85149]/20 dark:text-[#f85149]">
          <ShieldAlert className="w-3 h-3" />
          점수 확정 보류
        </span>
      );
    }

    // 기본: 클라이언트 실행, 미검증
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f6f8fa] text-[#57606a] dark:bg-[#21262d] dark:text-[#8b949e]"
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
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#fff8c5] text-[#9a6700] dark:bg-[#9e6a03]/20 dark:text-[#d29922] font-medium">
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
              <div className="text-sm font-medium text-[#57606a] dark:text-[#8b949e]">총점</div>
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-sm text-[#6e7781] dark:text-[#6e7681] mt-1">/ 100점</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6e7781] dark:text-[#6e7681] mb-1">등급</div>
            <div className={`text-2xl font-bold ${scoreColor}`}>{scoreGrade}</div>
          </div>
        </div>

        {/* 점수 구성 설명 */}
        <div className="mt-4 pt-4 border-t border-[#d0d7de] dark:border-[#30363d]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#8b949e] rounded-full"></div>
              <span className="text-[#57606a] dark:text-[#8b949e]">기본 점수: 30점</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#3fb950] rounded-full"></div>
              <span className="text-[#57606a] dark:text-[#8b949e]">버그 탐지: {score - 30}점</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mutant Kill Ratio - GitHub Dark 스타일 */}
      {killRatio !== null && (
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-[#d0d7de] dark:border-[#30363d] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#57606a] dark:text-[#8b949e]" />
            <h4 className="text-sm font-semibold text-[#24292f] dark:text-[#c9d1d9]" title="Mutation Kill Rate - 테스트가 버그를 발견한 비율">
              버그 탐지율
            </h4>
          </div>

          <div className="space-y-3">
            {/* 진행 바 - GitHub Dark 그라데이션 */}
            <div className="relative">
              <div className="flex-1 bg-[#eaeef2] dark:bg-[#21262d] rounded-full h-6 overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                    killRatio >= 80
                      ? "bg-[#1a7f37] dark:bg-[#238636]"
                      : killRatio >= 50
                      ? "bg-[#9a6700] dark:bg-[#9e6a03]"
                      : "bg-[#cf222e] dark:bg-[#da3633]"
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
                  <span className="text-xs font-medium text-[#24292f] dark:text-[#c9d1d9]">
                    {killRatio.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6e7781] dark:text-[#6e7681]" />
                <span className="text-[#57606a] dark:text-[#8b949e]">
                  발견된 버그: <span className="font-semibold text-[#24292f] dark:text-[#c9d1d9]">{killedMutants}건</span>
                </span>
              </div>
              <span className="text-[#6e7781] dark:text-[#6e7681]">
                전체: <span className="font-semibold">{totalMutants}건</span>
              </span>
            </div>

            {/* 성과 평가 */}
            <div className="mt-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
              <p className="text-xs text-[#6e7781] dark:text-[#6e7681]">
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

