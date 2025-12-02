/** Submission status display component */

import { useEffect, useState } from "react";
import type { Submission } from "@/types/problem";

interface SubmissionStatusProps {
  status: Submission["status"];
  createdAt?: string;
}

export default function SubmissionStatus({ status, createdAt }: SubmissionStatusProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const statusConfig = {
    PENDING: {
      label: "진행 중",
      color: "bg-blue-100 text-blue-800",
      icon: "🔄",
      showSpinner: true,
      message: "채점을 진행하고 있습니다...",
    },
    RUNNING: {
      label: "채점 중",
      color: "bg-blue-100 text-blue-800",
      icon: "🔄",
      showSpinner: true,
      message: "테스트 코드를 실행하고 있습니다...",
    },
    SUCCESS: {
      label: "완료",
      color: "bg-green-100 text-green-800",
      icon: "✅",
      showSpinner: false,
      message: "채점이 완료되었습니다.",
    },
    FAILURE: {
      label: "실패",
      color: "bg-red-100 text-red-800",
      icon: "❌",
      showSpinner: false,
      message: "테스트가 실패했습니다.",
    },
    ERROR: {
      label: "에러",
      color: "bg-red-100 text-red-800",
      icon: "⚠️",
      showSpinner: false,
      message: "채점 중 오류가 발생했습니다.",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  // 경과 시간 계산 (PENDING 또는 RUNNING 상태일 때만)
  useEffect(() => {
    if ((status !== "PENDING" && status !== "RUNNING") || !createdAt) {
      setElapsedTime("");
      return;
    }

    const updateElapsedTime = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const elapsed = Math.floor((now - created) / 1000); // 초 단위

      if (elapsed < 60) {
        setElapsedTime(`${elapsed}초`);
      } else if (elapsed < 3600) {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes}분 ${seconds}초`);
      } else {
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        setElapsedTime(`${hours}시간 ${minutes}분`);
      }
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [status, createdAt]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {config.showSpinner ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : (
          <span className="text-xl">{config.icon}</span>
        )}
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
        >
          {config.label}
        </span>
      </div>
      {(status === "PENDING" || status === "RUNNING") && (
        <div className="ml-7 space-y-1">
          <p className="text-sm text-gray-600">{config.message}</p>
          {elapsedTime && (
            <p className="text-xs text-gray-500">
              경과 시간: {elapsedTime} (2초마다 상태 확인 중)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

