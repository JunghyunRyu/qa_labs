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
        isPulsing ? "scale-[1.02]" : "scale-100",
      ].join(" ")}
      style={{
        backgroundColor: active ? "rgba(88, 166, 255, 0.1)" : "var(--surface-elevated)",
        borderColor: active ? "rgba(88, 166, 255, 0.5)" : "var(--border-subtle)",
        boxShadow: active ? "0 0 0 2px rgba(88, 166, 255, 0.3)" : undefined,
      }}
      aria-current={active ? "step" : undefined}
    >
      {/* 좌측 진행 표시 바 */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-500 ease-out"
        style={{
          height: active ? "2.5rem" : "0",
          backgroundColor: "var(--accent)",
          opacity: active ? 1 : 0,
        }}
      />

      <div className="flex items-start gap-3 pl-2">
        <div
          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300"
          style={{
            backgroundColor: active ? "var(--surface-elevated)" : "var(--surface)",
            borderColor: active ? "rgba(88, 166, 255, 0.3)" : "var(--border-subtle)",
            color: active ? "var(--accent)" : "var(--foreground)",
            transform: active ? "scale(1.1)" : "scale(1)",
            boxShadow: active ? "0 4px 6px -1px rgba(0,0,0,0.1)" : undefined,
          }}
        >
          <Icon name={step.icon} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold transition-colors duration-300"
              style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
            >
              {step.number}
            </span>
            <h3 className="text-sm sm:text-base font-semibold" style={{ color: "var(--foreground)" }}>
              {step.titleKo}
              <span className="ml-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {step.title}
              </span>
            </h3>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {step.description}
          </p>
        </div>
      </div>
    </button>
  );
}
