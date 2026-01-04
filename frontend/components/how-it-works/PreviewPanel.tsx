"use client";

/**
 * PreviewPanel Component
 *
 * HowItWorks 섹션의 오른쪽 프리뷰 패널.
 * Step 클릭 시 해당 단계의 프리뷰를 표시합니다.
 * Phase 2: 정교화된 프리뷰 컴포넌트 사용
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  WriteTestsPreview,
  ValidatePreview,
  MutantsPreview,
  DetectionPreview,
  ScorePreview,
} from "./previews";

interface PreviewPanelProps {
  activeStepId: number;
}

export default function PreviewPanel({ activeStepId }: PreviewPanelProps) {
  const renderPreview = () => {
    switch (activeStepId) {
      case 1:
        return <WriteTestsPreview />;
      case 2:
        return <ValidatePreview />;
      case 3:
        return <MutantsPreview />;
      case 4:
        return <DetectionPreview />;
      case 5:
        return <ScorePreview />;
      default:
        return <DetectionPreview />;
    }
  };

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="mb-4 pb-3 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Mutation Testing 흐름
        </div>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          좌측 단계를 클릭하여 각 과정을 확인하세요
        </div>
      </div>

      {/* Preview Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepId}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
            opacity: { duration: 0.2 },
          }}
        >
          {renderPreview()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
