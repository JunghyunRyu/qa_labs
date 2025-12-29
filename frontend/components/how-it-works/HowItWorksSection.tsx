"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import StepCard, { HowItWorksStep } from "./StepCard";
import PreviewPanel from "./PreviewPanel";
import QualityChips from "./QualityChips";

type Props = {
  steps?: HowItWorksStep[];
  /** 자동재생 간격 (ms), 기본값: 3500ms */
  autoPlayInterval?: number;
  /** 자동재생 활성화 여부, 기본값: true */
  enableAutoPlay?: boolean;
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

export default function HowItWorksSection({
  steps,
  autoPlayInterval = 3500,
  enableAutoPlay = true,
}: Props) {
  const data = useMemo(() => steps ?? defaultSteps, [steps]);
  // 기본 활성 Step: 01 (자동재생 시작점)
  const [activeStepId, setActiveStepId] = useState<number>(1);
  // 자동재생 완료 여부
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  // 사용자 상호작용 여부
  const [userInteracted, setUserInteracted] = useState(false);
  // 섹션 가시성 추적
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 사용자가 클릭하면 자동재생 중단
  const handleStepClick = useCallback((stepId: number) => {
    setUserInteracted(true);
    setActiveStepId(stepId);
  }, []);

  // Intersection Observer: 섹션이 뷰포트에 들어오면 자동재생 시작
  useEffect(() => {
    if (!enableAutoPlay || hasAutoPlayed || userInteracted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = sectionRef.current;
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, [enableAutoPlay, hasAutoPlayed, userInteracted]);

  // 자동재생 로직 - ref로 현재 인덱스 추적
  const autoPlayIndexRef = useRef(0);
  const isAutoPlayingRef = useRef(false);

  useEffect(() => {
    // 접근성: prefers-reduced-motion 존중
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      !enableAutoPlay ||
      !isVisible ||
      hasAutoPlayed ||
      userInteracted ||
      prefersReducedMotion ||
      isAutoPlayingRef.current
    ) {
      return;
    }

    isAutoPlayingRef.current = true;
    const stepOrder = [1, 2, 3, 4, 5];

    const timer = setInterval(() => {
      if (userInteracted) {
        clearInterval(timer);
        isAutoPlayingRef.current = false;
        return;
      }

      autoPlayIndexRef.current++;
      if (autoPlayIndexRef.current >= stepOrder.length) {
        // 한 사이클 완료
        clearInterval(timer);
        setHasAutoPlayed(true);
        isAutoPlayingRef.current = false;
        return;
      }

      setActiveStepId(stepOrder[autoPlayIndexRef.current]);
    }, autoPlayInterval);

    return () => {
      clearInterval(timer);
      isAutoPlayingRef.current = false;
    };
  }, [enableAutoPlay, isVisible, hasAutoPlayed, userInteracted, autoPlayInterval]);

  return (
    <section
      ref={sectionRef}
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
                onClick={() => handleStepClick(step.id)}
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
          <QualityChips activeStepId={activeStepId} />
        </div>
      </div>
    </section>
  );
}
