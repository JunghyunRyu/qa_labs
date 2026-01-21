/**
 * PyodideStatusIndicator
 *
 * Pyodide 초기화 상태를 보여주는 인디케이터 컴포넌트
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  status: PyodideStatus;
  progress?: number;
  message?: string;
  className?: string;
}

export function PyodideStatusIndicator({ status, progress = 0, message, className = '' }: Props) {
  // 준비 완료 시 숨김
  if (status === 'ready') return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {status === 'loading' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          <div className="flex flex-col">
            <span className="text-slate-300">
              Python 환경 준비 중... {progress}%
            </span>
            {message && (
              <span className="text-xs text-slate-400">{message}</span>
            )}
          </div>
        </>
      )}
      {status === 'error' && (
        <span className="text-red-400">환경 로드 실패</span>
      )}
    </div>
  );
}
