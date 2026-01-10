"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

/**
 * StepIndicator - 튜토리얼 진행 상태 표시
 *
 * 현재 단계를 시각적으로 표시합니다.
 */
export default function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step dot/number */}
            <div
              className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0d1117]"
                    : "bg-[#30363d] text-gray-500"
                }
              `}
            >
              {isCompleted ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step
              )}
            </div>

            {/* Connector line */}
            {step < totalSteps && (
              <div
                className={`w-6 h-0.5 mx-1 transition-colors ${
                  isCompleted ? "bg-green-500" : "bg-[#30363d]"
                }`}
              />
            )}
          </div>
        );
      })}

      {/* Step label */}
      {stepLabels && stepLabels[currentStep - 1] && (
        <span className="ml-2 text-sm text-gray-400">
          {stepLabels[currentStep - 1]}
        </span>
      )}
    </div>
  );
}
