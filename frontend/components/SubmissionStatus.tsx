/** Submission status display component */

import type { Submission } from "@/types/problem";

interface SubmissionStatusProps {
  status: Submission["status"];
}

export default function SubmissionStatus({ status }: SubmissionStatusProps) {
  const statusConfig = {
    PENDING: {
      label: "대기 중",
      color: "bg-gray-100 text-gray-800",
      icon: "⏳",
    },
    RUNNING: {
      label: "채점 중",
      color: "bg-blue-100 text-blue-800",
      icon: "🔄",
    },
    SUCCESS: {
      label: "완료",
      color: "bg-green-100 text-green-800",
      icon: "✅",
    },
    FAILURE: {
      label: "실패",
      color: "bg-red-100 text-red-800",
      icon: "❌",
    },
    ERROR: {
      label: "에러",
      color: "bg-red-100 text-red-800",
      icon: "⚠️",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{config.icon}</span>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.label}
      </span>
    </div>
  );
}

