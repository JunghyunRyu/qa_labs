/** Submission status display component */

import { useEffect, useState } from "react";
import { Clock, Loader2, CheckCircle, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import type { Submission, SubmissionProgress } from "@/types/problem";

interface SubmissionStatusProps {
  status: Submission["status"];
  createdAt?: string;
  progress?: SubmissionProgress;
}

export default function SubmissionStatus({ status, createdAt, progress }: SubmissionStatusProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const statusConfig: Record<string, {
    label: string;
    color: string;
    Icon: LucideIcon;
    animate?: boolean;
    message: string;
  }> = {
    PENDING: {
      label: "대기 중",
      color: "bg-gray-100 text-gray-600",
      Icon: Clock,
      message: "채점을 진행하고 있습니다...",
    },
    RUNNING: {
      label: "채점 중",
      color: "bg-blue-100 text-blue-800",
      Icon: Loader2,
      animate: true,
      message: "테스트 코드를 실행하고 있습니다...",
    },
    SUCCESS: {
      label: "완료",
      color: "bg-green-100 text-green-800",
      Icon: CheckCircle,
      message: "채점이 완료되었습니다.",
    },
    FAILURE: {
      label: "실패",
      color: "bg-red-100 text-red-800",
      Icon: XCircle,
      message: "테스트가 실패했습니다.",
    },
    ERROR: {
      label: "오류",
      color: "bg-orange-100 text-orange-800",
      Icon: AlertTriangle,
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

  const IconComponent = config.Icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <IconComponent
          className={`w-5 h-5 ${config.animate ? 'animate-spin' : ''}`}
        />
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
        >
          {config.label}
        </span>
      </div>
      {(status === "PENDING" || status === "RUNNING") && (
        <div className="ml-7 space-y-3">
          <p className="text-sm text-gray-600">{config.message}</p>

          {/* Progress bar */}
          {status === "RUNNING" && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{progress.message}</span>
                <span className="text-gray-500">{progress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              {progress.current !== undefined && progress.total !== undefined && (
                <p className="text-xs text-gray-500">
                  {progress.current} / {progress.total} 완료
                </p>
              )}
            </div>
          )}

          {elapsedTime && (
            <p className="text-xs text-gray-500">
              경과 시간: {elapsedTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

