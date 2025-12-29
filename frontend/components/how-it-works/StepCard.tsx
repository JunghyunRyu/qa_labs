"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  CheckCircle2,
  Code2,
  Target,
  Trophy,
} from "lucide-react";

export type HowItWorksStep = {
  id: number;
  number: string;
  title: string;
  titleKo: string;
  description: string;
  icon: "code" | "check" | "bug" | "target" | "trophy";
};

function Icon({ name }: { name: HowItWorksStep["icon"] }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "code":
      return <Code2 className={cls} />;
    case "check":
      return <CheckCircle2 className={cls} />;
    case "bug":
      return <Bug className={cls} />;
    case "target":
      return <Target className={cls} />;
    case "trophy":
      return <Trophy className={cls} />;
  }
}

export default function StepCard({
  step,
  active,
  onClick,
}: {
  step: HowItWorksStep;
  active: boolean;
  onClick?: () => void;
}) {
  const [isPulsing, setIsPulsing] = useState(false);

  // active가 true가 될 때 pulse 효과
  useEffect(() => {
    if (active) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative w-full rounded-2xl border p-4 text-left transition-all duration-300",
        "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/50",
        active
          ? "border-blue-500/50 bg-blue-50 shadow-md ring-2 ring-blue-400/30 dark:border-blue-400/50 dark:bg-blue-950/40 dark:ring-blue-500/20"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/30 dark:hover:border-gray-700",
        isPulsing ? "scale-[1.02]" : "scale-100",
      ].join(" ")}
      aria-current={active ? "step" : undefined}
    >
      {/* 좌측 진행 표시 바 */}
      <div
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-500 ease-out",
          active
            ? "h-10 bg-blue-500 dark:bg-blue-400 opacity-100"
            : "h-0 bg-blue-500 dark:bg-blue-400 opacity-0",
        ].join(" ")}
      />

      <div className="flex items-start gap-3 pl-2">
        <div
          className={[
            "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300",
            active
              ? "border-blue-500/30 bg-white text-blue-600 shadow-md scale-110 dark:border-blue-400/30 dark:bg-gray-950 dark:text-blue-400"
              : "border-gray-200 bg-gray-50 text-gray-700 scale-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200",
          ].join(" ")}
        >
          <Icon name={step.icon} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={[
                "text-xs font-bold transition-colors duration-300",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400",
              ].join(" ")}
            >
              {step.number}
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50">
              {step.titleKo}
              <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {step.title}
              </span>
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {step.description}
          </p>
        </div>
      </div>
    </button>
  );
}
