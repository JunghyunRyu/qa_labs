/**
 * MutationScoreboard - Kill Ratio 현황판
 * 채점 결과에서 버그 탐지율을 시각화하는 현황판 컴포넌트
 */

import { Target, TrendingUp, CheckCircle2 } from "lucide-react";

interface MutantResult {
  id: string;
  mutationType: string;
  lineNumber: number;
  wasKilled: boolean;
}

interface MutationScoreboardProps {
  /** Golden Code 통과 여부 */
  goldenCodePassed: boolean;
  /** 잡은 버그 수 */
  killedMutants: number;
  /** 전체 버그 수 */
  totalMutants: number;
  /** 개별 뮤턴트 결과 (선택적) */
  mutantDetails?: MutantResult[];
  /** 컴팩트 모드 (간략 표시) */
  compact?: boolean;
}

export default function MutationScoreboard({
  goldenCodePassed,
  killedMutants,
  totalMutants,
  mutantDetails,
  compact = false,
}: MutationScoreboardProps) {
  const killRatio = totalMutants > 0 ? (killedMutants / totalMutants) * 100 : 0;
  const escapedMutants = totalMutants - killedMutants;

  // Kill Ratio 색상 결정
  const getRatioColor = () => {
    if (killRatio >= 80) return {
      bg: "bg-[#dafbe1] dark:bg-[#238636]/10",
      border: "border-[#aceebb] dark:border-[#238636]/40",
      text: "text-[#1a7f37] dark:text-[#3fb950]",
      bar: "bg-[#1a7f37] dark:bg-[#238636]"
    };
    if (killRatio >= 50) return {
      bg: "bg-[#fff8c5] dark:bg-[#9e6a03]/10",
      border: "border-[#fae17d] dark:border-[#9e6a03]/40",
      text: "text-[#9a6700] dark:text-[#d29922]",
      bar: "bg-[#9a6700] dark:bg-[#9e6a03]"
    };
    return {
      bg: "bg-[#ffebe9] dark:bg-[#f85149]/10",
      border: "border-[#ffc1ba] dark:border-[#f85149]/40",
      text: "text-[#cf222e] dark:text-[#f85149]",
      bar: "bg-[#cf222e] dark:bg-[#da3633]"
    };
  };

  const colors = getRatioColor();

  // 컴팩트 모드 (결과 탭에서 사용)
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Golden Code 통과 여부 */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 ${ goldenCodePassed ? 'text-[#3fb950]' : 'text-[#f85149]'}`} />
          <span className={`text-sm font-medium ${ goldenCodePassed ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
            Golden Code: {goldenCodePassed ? 'Passed' : 'Failed'}
          </span>
        </div>

        {/* Kill Ratio */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#8b949e]" />
          <span className="text-sm text-[#c9d1d9]">
            Bugs Caught: <span className={`font-bold ${colors.text}`}>{killedMutants}</span> / {totalMutants} ({killRatio.toFixed(0)}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-[#21262d] rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${colors.bar}`}
              style={{ width: `${killRatio}%` }}
            >
              {killRatio > 20 && (
                <span className="text-xs font-bold text-white">
                  {killRatio.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          {killRatio <= 20 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-[#c9d1d9]">
                {killRatio.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 풀 모드 (상세 현황판)
  return (
    <div className={`rounded-lg border-2 p-4 ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[#8b949e]" />
        <h3 className="text-lg font-bold text-[#c9d1d9]">버그 포획 현황판</h3>
      </div>

      {/* Golden Code Status */}
      <div className={`mb-4 p-3 rounded-lg border ${
        goldenCodePassed
          ? 'bg-[#dafbe1]/50 border-[#aceebb] dark:bg-[#238636]/5 dark:border-[#238636]/30'
          : 'bg-[#ffebe9]/50 border-[#ffc1ba] dark:bg-[#f85149]/5 dark:border-[#f85149]/30'
      }`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 ${
            goldenCodePassed ? 'text-[#1a7f37] dark:text-[#3fb950]' : 'text-[#cf222e] dark:text-[#f85149]'
          }`} />
          <span className={`text-sm font-semibold ${
            goldenCodePassed ? 'text-[#1a7f37] dark:text-[#3fb950]' : 'text-[#cf222e] dark:text-[#f85149]'
          }`}>
            ✅ Golden Code: {goldenCodePassed ? 'Passed' : 'Failed'}
          </span>
        </div>
        {!goldenCodePassed && (
          <p className="text-xs text-[#cf222e] dark:text-[#f85149] mt-1 ml-6">
            정상 코드에서 테스트가 실패했습니다. 테스트 로직을 확인하세요.
          </p>
        )}
      </div>

      {/* Kill Ratio Stats */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#6e7681]" />
            <span className="text-sm text-[#8b949e]">버그 탐지율 (Kill Ratio)</span>
          </div>
          <span className={`text-2xl font-bold ${colors.text}`}>
            {killRatio.toFixed(1)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] rounded-full h-6 overflow-hidden">
            <div
              className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${colors.bar}`}
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
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-2 bg-white dark:bg-[#161b22] rounded border border-[#d0d7de] dark:border-[#30363d]">
          <div className="text-xs text-[#6e7681] mb-1">잡은 버그</div>
          <div className="text-xl font-bold text-[#1a7f37] dark:text-[#3fb950]">
            🎯 {killedMutants}건
          </div>
        </div>
        <div className="p-2 bg-white dark:bg-[#161b22] rounded border border-[#d0d7de] dark:border-[#30363d]">
          <div className="text-xs text-[#6e7681] mb-1">놓친 버그</div>
          <div className="text-xl font-bold text-[#cf222e] dark:text-[#f85149]">
            🐛 {escapedMutants}건
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="mt-4 pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
        <p className="text-xs text-[#6e7781] dark:text-[#6e7681]">
          {killRatio >= 80
            ? "🎉 훌륭합니다! 대부분의 버그를 찾아냈습니다."
            : killRatio >= 50
            ? "👍 좋은 시작입니다. 더 많은 테스트 케이스를 추가해보세요."
            : "💡 더 많은 엣지 케이스를 고려해보세요. AI 코치에게 힌트를 받아보세요!"}
        </p>
      </div>
    </div>
  );
}
