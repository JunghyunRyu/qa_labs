/** Display assertion diff with expected vs actual values */

interface DiffDisplayProps {
  diff: { expected: string; actual: string };
}

export default function DiffDisplay({ diff }: DiffDisplayProps) {
  return (
    <div className="mt-3 bg-white rounded-lg border border-gray-300 p-4 space-y-2">
      <div className="text-xs font-semibold text-gray-600 mb-2">비교 결과</div>

      <div className="grid grid-cols-2 gap-4">
        {/* Expected */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            예상값 (Expected)
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <code className="text-sm font-mono text-green-800 break-all">
              {diff.expected}
            </code>
          </div>
        </div>

        {/* Actual */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            실제값 (Actual)
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <code className="text-sm font-mono text-red-800 break-all">
              {diff.actual}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
