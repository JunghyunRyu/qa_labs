/** Score display component */

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
      ? ((killedMutants / totalMutants) * 100).toFixed(1)
      : null;

  return (
    <div>
      <div className="mb-4">
        <div className="text-4xl font-bold text-blue-600">{score}</div>
        <div className="text-sm text-gray-600 mt-1">/ 100점</div>
      </div>

      {killRatio !== null && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Mutant Kill Ratio
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${killRatio}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {killedMutants} / {totalMutants} ({killRatio}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

