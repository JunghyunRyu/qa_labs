/** Display list of test results with pass/fail status */

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import DiffDisplay from "./DiffDisplay";

interface TestResult {
  name: string;
  status: "PASSED" | "FAILED" | "ERROR";
  error?: {
    type: string;
    message: string;
    location: string;
    diff?: { expected: string; actual: string };
  };
}

interface TestResultsListProps {
  tests: TestResult[];
}

export default function TestResultsList({ tests }: TestResultsListProps) {
  const passedCount = tests.filter((t) => t.status === "PASSED").length;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        테스트 결과 ({passedCount}/{tests.length} 통과)
      </h4>

      {tests.map((test, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-lg border ${
            test.status === "PASSED"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {test.status === "PASSED" && (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            {test.status === "FAILED" && (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            {test.status === "ERROR" && (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <code className="text-sm font-mono text-gray-800 break-all">
                {test.name}
              </code>

              {test.error && (
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-red-700">
                    <span className="font-semibold">{test.error.type}:</span>{" "}
                    {test.error.message}
                  </div>
                  {test.error.diff && <DiffDisplay diff={test.error.diff} />}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
