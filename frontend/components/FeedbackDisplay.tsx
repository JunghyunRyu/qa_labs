/** Feedback display component */

interface Feedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggested_tests: string[];
  score_adjustment?: number;
}

interface FeedbackDisplayProps {
  feedback: Feedback;
}

export default function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">AI 피드백</h3>

      {/* Summary */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-2">요약</h4>
        <p className="text-gray-700">{feedback.summary}</p>
      </div>

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-green-800 mb-2 flex items-center gap-2">
            <span className="text-xl">✓</span>
            잘한 점
          </h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {feedback.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses && feedback.weaknesses.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-orange-800 mb-2 flex items-center gap-2">
            <span className="text-xl">!</span>
            개선할 점
          </h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {feedback.weaknesses.map((weakness, index) => (
              <li key={index}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Tests */}
      {feedback.suggested_tests && feedback.suggested_tests.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span>
            제안된 테스트
          </h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {feedback.suggested_tests.map((test, index) => (
              <li key={index}>{test}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Adjustment */}
      {feedback.score_adjustment !== undefined && feedback.score_adjustment !== 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            점수 조정: {feedback.score_adjustment > 0 ? "+" : ""}
            {feedback.score_adjustment}점
          </p>
        </div>
      )}
    </div>
  );
}

