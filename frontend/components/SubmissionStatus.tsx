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
  // GitHub Dark 스타일: 상태 색상
  const statusConfig: Record<string, {
    label: string;
    color: string;
    Icon: LucideIcon;
    animate?: boolean;
    message: string;
  }> = {
    PENDING: {
      label: "대기 중",
      color: "bg-[#f6f8fa] text-[#57606a] dark:bg-[#21262d] dark:text-[#8b949e]",
      Icon: Clock,
      message: "채점을 진행하고 있습니다...",
    },
    RUNNING: {
      label: "채점 중",
      color: "bg-[#f6f8fa] text-[#24292f] dark:bg-[#21262d] dark:text-[#c9d1d9]",
      Icon: Loader2,
      animate: true,
      message: "테스트 코드를 실행하고 있습니다...",
    },
    SUCCESS: {
      label: "완료",
      color: "bg-[#dafbe1] text-[#1a7f37] dark:bg-[#238636]/20 dark:text-[#3fb950]",
      Icon: CheckCircle,
      message: "채점이 완료되었습니다.",
    },
    FAILURE: {
      label: "실패",
      color: "bg-[#ffebe9] text-[#cf222e] dark:bg-[#f85149]/20 dark:text-[#f85149]",
      Icon: XCircle,
      message: "테스트가 실패했습니다.",
    },
    ERROR: {
      label: "오류",
      color: "bg-[#fff8c5] text-[#9a6700] dark:bg-[#9e6a03]/20 dark:text-[#d29922]",
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
          <p className="text-sm text-[#57606a] dark:text-[#8b949e]">{config.message}</p>

          {/* Progress bar - GitHub Dark 스타일 */}
          {status === "RUNNING" && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#57606a] dark:text-[#8b949e]">{progress.message}</span>
                <span className="text-[#6e7781] dark:text-[#6e7681]">{progress.percent}%</span>
              </div>
              <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] rounded-full h-2.5">
                <div
                  className="bg-[#58a6ff] dark:bg-[#58a6ff] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              {progress.current !== undefined && progress.total !== undefined && (
                <p className="text-xs text-[#6e7781] dark:text-[#6e7681]">
                  {progress.current} / {progress.total} 완료
                </p>
              )}
            </div>
          )}

          {elapsedTime && (
            <p className="text-xs text-[#6e7781] dark:text-[#6e7681]">
              경과 시간: {elapsedTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

