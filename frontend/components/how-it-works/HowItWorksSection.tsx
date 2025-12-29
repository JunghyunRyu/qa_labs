"use client";

import { useMemo, useState } from "react";
import StepCard, { HowItWorksStep } from "./StepCard";
import PreviewPanel from "./PreviewPanel";
import QualityChips from "./QualityChips";

type Props = {
  steps?: HowItWorksStep[];
};

const defaultSteps: HowItWorksStep[] = [
  {
    id: 1,
    number: "01",
    title: "Write Tests",
    titleKo: "테스트 작성",
    description: "다양한 입력 케이스를 커버하는 테스트를 작성합니다.",
    icon: "code",
  },
  {
    id: 2,
    number: "02",
    title: "Validate on Golden",
    titleKo: "기본 검증",
    description: "정답 코드에서 테스트가 통과하는지 확인합니다.",
    icon: "check",
  },
  {
    id: 3,
    number: "03",
    title: "Generate Mutants",
    titleKo: "버그 코드 생성",
    description: "정상 코드에 버그를 심어 변형 코드(Mutant)를 만듭니다.",
    icon: "bug",
  },
  {
    id: 4,
    number: "04",
    title: "Measure Detection",
    titleKo: "버그 탐지율 측정",
    description: "테스트가 버그를 얼마나 잡아내는지 탐지율을 측정합니다.",
    icon: "target",
  },
  {
    id: 5,
    number: "05",
    title: "Score & Feedback",
    titleKo: "점수 & 피드백",
    description: "버그 탐지율 + 테스트 품질 분석 + AI 피드백을 제공합니다.",
    icon: "trophy",
  },
];

export default function HowItWorksSection({ steps }: Props) {
  const data = useMemo(() => steps ?? defaultSteps, [steps]);
  // 기본 활성 Step: 04 (탐지율) - 첫 인상에서 "결과"가 보이도록
  const [activeStepId, setActiveStepId] = useState<number>(4);

  return (
    <section
      id="how-it-works"
      className="section-base bg-[var(--surface)]"
      aria-labelledby="how-it-works-title"
    >
      <div className="section-container">
        {/* Header */}
        <div className="section-header">
          <h2
            id="how-it-works-title"
            className="section-title"
          >
            이렇게 진행됩니다
          </h2>
          <p className="section-subtitle">
            숨은 버그를 얼마나 잡는지, 버그 탐지율과 테스트 품질을 함께 측정합니다.
          </p>
        </div>

        {/* Desktop: 2 columns / Mobile: 1 column */}
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 lg:items-start">
          {/* Steps (Left on desktop, bottom on mobile) */}
          <div className="space-y-3 order-2 lg:order-1">
            {data.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                active={step.id === activeStepId}
                onClick={() => setActiveStepId(step.id)}
              />
            ))}
          </div>

          {/* Preview Panel (Right on desktop, top on mobile) */}
          <div className="order-1 lg:order-2">
            <PreviewPanel activeStepId={activeStepId} />
          </div>
        </div>

        {/* Quality Chips */}
        <div className="mt-10">
          <QualityChips />
        </div>
      </div>
    </section>
  );
}
