"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";

type Props = {
  onStageChange?: (stageId: number) => void;
  initialStage?: number;
};

type Phase =
  | "idle"
  | "golden"
  | "mutants"
  | "results"
  | "score"
  | "complete";

export default function MutationDiagram({ onStageChange, initialStage = 1 }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.4, once: true });

  const [phase, setPhase] = useState<Phase>("idle");
  const [animationKey, setAnimationKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const timersRef = useRef<number[]>([]);

  // onStageChange를 ref로 저장하여 의존성 문제 해결
  const onStageChangeRef = useRef(onStageChange);
  useEffect(() => {
    onStageChangeRef.current = onStageChange;
  }, [onStageChange]);

  // Hydration safe: only use reduceMotion after mount
  const reduceMotion = isMounted ? shouldReduceMotion : false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 타임라인: 총 6.5초, 각 단계 1~1.5초 유지
  const schedule = useMemo(
    () => [
      { t: 800, phase: "golden" as const, step: 2 },      // Step 1 → 2
      { t: 2200, phase: "mutants" as const, step: 3 },    // Step 2 → 3 (1.4s)
      { t: 3800, phase: "results" as const, step: 4 },    // Step 3 → 4 (1.6s)
      { t: 5200, phase: "score" as const, step: 5 },      // Step 4 → 5 (1.4s)
      { t: 6500, phase: "complete" as const, step: 5 },   // 완료 (1.3s)
    ],
    []
  );

  const runAnimation = useCallback(() => {
    // Clear existing timers
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    // Reset to idle first (Step 1)
    setPhase("idle");
    onStageChangeRef.current?.(initialStage);

    if (reduceMotion) {
      // Reduced Motion: 애니메이션 없이 Step만 순차 진행 (빠른 간격)
      const reducedSchedule = [
        { t: 300, phase: "golden" as const, step: 2 },
        { t: 600, phase: "mutants" as const, step: 3 },
        { t: 900, phase: "results" as const, step: 4 },
        { t: 1200, phase: "score" as const, step: 5 },
        { t: 1500, phase: "complete" as const, step: 5 },
      ];
      reducedSchedule.forEach((s) => {
        const id = window.setTimeout(() => {
          setPhase(s.phase);
          onStageChangeRef.current?.(s.step);
        }, s.t);
        timersRef.current.push(id);
      });
      return;
    }

    // Schedule animation phases
    schedule.forEach((s) => {
      const id = window.setTimeout(() => {
        setPhase(s.phase);
        onStageChangeRef.current?.(s.step);
      }, s.t);
      timersRef.current.push(id);
    });
  }, [reduceMotion, schedule, initialStage]);

  // Initial stage on mount
  useEffect(() => {
    onStageChangeRef.current?.(initialStage);
  }, [initialStage]);

  // Run animation when in view
  useEffect(() => {
    if (!inView) return;
    runAnimation();

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [inView, runAnimation]);

  // Run animation on replay
  useEffect(() => {
    if (animationKey === 0) return;
    runAnimation();

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [animationKey, runAnimation]);

  const handleReplay = () => {
    setAnimationKey((prev) => prev + 1);
  };

  const box = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const path = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 0.6 } },
  };

  const showGolden = phase !== "idle";
  const showMutants = ["mutants", "results", "score", "complete"].includes(phase);
  const showResults = ["results", "score", "complete"].includes(phase);
  const showScore = ["score", "complete"].includes(phase);
  const isComplete = phase === "complete";

  const mutants = [
    { x: 80, label: "뮤턴트 1", result: "탐지됨", ok: true },
    { x: 220, label: "뮤턴트 2", result: "탐지됨", ok: true },
    { x: 360, label: "뮤턴트 3", result: "미탐지", ok: false },
    { x: 500, label: "뮤턴트 4", result: "탐지됨", ok: true },
  ];

  const killRatio = 75; // 3/4 killed

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950/50"
      aria-label="Mutation Testing flow diagram"
    >
      {/* Header */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Mutation Testing 흐름
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          수치는 예시이며, 실제 결과는 제출 코드에 따라 달라집니다.
        </div>
      </div>

      {/* SVG Diagram */}
      <svg key={animationKey} viewBox="0 0 640 340" className="h-auto w-full">
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              className="fill-gray-400 dark:fill-gray-500"
            />
          </marker>
          <marker
            id="arrowhead-light"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              className="fill-gray-300 dark:fill-gray-600"
            />
          </marker>
        </defs>

        {/* Test Code Box */}
        <motion.g variants={box} initial="show" animate="show">
          <rect
            x="250"
            y="10"
            width="140"
            height="50"
            rx="12"
            className="fill-gray-50 stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
            strokeWidth="2"
          />
          <text
            x="320"
            y="40"
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300"
            fontSize="14"
            fontWeight="600"
          >
            내 테스트
          </text>
        </motion.g>

        {/* Arrow: Tests -> Golden */}
        <motion.path
          d="M 320 60 L 320 85"
          fill="none"
          strokeWidth="2"
          className="stroke-gray-400 dark:stroke-gray-500"
          markerEnd="url(#arrowhead)"
          variants={path}
          initial="hidden"
          animate={showGolden ? "show" : "hidden"}
        />

        {/* Golden Code Box */}
        <motion.g
          variants={box}
          initial="hidden"
          animate={showGolden ? "show" : "hidden"}
        >
          <rect
            x="200"
            y="90"
            width="240"
            height="55"
            rx="12"
            className="fill-gray-50 stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
            strokeWidth="2"
          />
          <text
            x="320"
            y="115"
            textAnchor="middle"
            className="fill-gray-800 dark:fill-gray-200"
            fontSize="14"
            fontWeight="700"
          >
            정상 코드
          </text>
          <text
            x="320"
            y="135"
            textAnchor="middle"
            className="fill-green-600 dark:fill-green-400"
            fontSize="12"
            fontWeight="600"
          >
            통과
          </text>
        </motion.g>

        {/* Arrow: Golden -> Split */}
        <motion.path
          d="M 320 145 L 320 165"
          fill="none"
          strokeWidth="2"
          className="stroke-gray-400 dark:stroke-gray-500"
          markerEnd="url(#arrowhead)"
          variants={path}
          initial="hidden"
          animate={showMutants ? "show" : "hidden"}
        />

        {/* Split arrows to mutants */}
        {mutants.map((m, idx) => (
          <motion.path
            key={`arrow-${idx}`}
            d={`M 320 170 Q ${(m.x + 60 + 320) / 2} 190 ${m.x + 60} 205`}
            fill="none"
            strokeWidth="2"
            className="stroke-gray-300 dark:stroke-gray-600"
            markerEnd="url(#arrowhead-light)"
            variants={path}
            initial="hidden"
            animate={showMutants ? "show" : "hidden"}
            transition={{ delay: idx * 0.1 }}
          />
        ))}

        {/* Mutant Boxes */}
        {mutants.map((m, idx) => (
          <motion.g
            key={m.label}
            variants={box}
            initial="hidden"
            animate={showMutants ? "show" : "hidden"}
            transition={{ delay: idx * 0.1 }}
          >
            <rect
              x={m.x}
              y="210"
              width="120"
              height="70"
              rx="12"
              className="fill-gray-50 stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
              strokeWidth="2"
            />
            <text
              x={m.x + 60}
              y="238"
              textAnchor="middle"
              className="fill-gray-700 dark:fill-gray-300"
              fontSize="12"
              fontWeight="600"
            >
              {m.label}
            </text>

            {/* Result badge */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: showResults ? 1 : 0 }}
              transition={{ duration: 0.25, delay: idx * 0.1 }}
            >
              <text
                x={m.x + 60}
                y="262"
                textAnchor="middle"
                className={
                  m.ok
                    ? "fill-red-600 dark:fill-red-400"
                    : "fill-amber-600 dark:fill-amber-400"
                }
                fontSize="11"
                fontWeight="700"
              >
                {m.result}
              </text>
            </motion.g>
          </motion.g>
        ))}

        {/* Score Section */}
        <motion.g
          variants={box}
          initial="hidden"
          animate={showScore ? "show" : "hidden"}
        >
          {/* Background bar */}
          <rect
            x="200"
            y="295"
            width="240"
            height="40"
            rx="10"
            className="fill-gray-50 stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
            strokeWidth="2"
          />

          {/* 버그 탐지율 label */}
          <text
            x="210"
            y="312"
            className="fill-gray-700 dark:fill-gray-300"
            fontSize="10"
            fontWeight="600"
          >
            버그 탐지율
          </text>

          {/* Progress bar background */}
          <rect
            x="280"
            y="302"
            width="100"
            height="12"
            rx="6"
            className="fill-gray-200 dark:fill-gray-700"
          />

          {/* Progress bar fill */}
          <motion.rect
            x="280"
            y="302"
            width="100"
            height="12"
            rx="6"
            className="fill-blue-600 dark:fill-blue-500"
            initial={{ width: 0 }}
            animate={{ width: showScore ? killRatio : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Percentage text + 예시 pill */}
          <text
            x="390"
            y="312"
            className="fill-gray-800 dark:fill-gray-200"
            fontSize="12"
            fontWeight="700"
          >
            {killRatio}%
          </text>
          <rect
            x="408"
            y="302"
            width="26"
            height="14"
            rx="4"
            className="fill-gray-200 dark:fill-gray-700"
          />
          <text
            x="421"
            y="312"
            textAnchor="middle"
            className="fill-gray-500 dark:fill-gray-400"
            fontSize="8"
          >
            예시
          </text>

          {/* Score */}
          <text
            x="320"
            y="328"
            textAnchor="middle"
            className="fill-gray-600 dark:fill-gray-400"
            fontSize="10"
          >
            점수(예시): 82
          </text>
        </motion.g>
      </svg>

      {/* Step 05 Callouts: 품질 분석 + AI 피드백 */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          테스트 품질 분석
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI 피드백 제공
        </span>
      </div>

      {/* Footer with Replay button */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {reduceMotion
            ? "모션 감소 모드"
            : isComplete
            ? "애니메이션 완료"
            : "애니메이션 재생 중..."}
        </span>
        <button
          type="button"
          onClick={handleReplay}
          disabled={!isComplete && !reduceMotion}
          className={[
            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            isComplete || reduceMotion
              ? "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600",
          ].join(" ")}
        >
          <RotateCcw className={`h-3 w-3 ${!isComplete && !reduceMotion ? "animate-spin" : ""}`} />
          {isComplete || reduceMotion ? "다시 보기" : "재생 중"}
        </button>
      </div>
    </div>
  );
}
