'use client';

/**
 * TestCaseInput Component
 *
 * 테스트 케이스 입력 컴포넌트입니다.
 * - 입력 타입 안내
 * - 실행 & 검증 버튼
 */

import { useState, useCallback, KeyboardEvent } from 'react';

interface TestCaseInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  inputHint?: string;
  disabled?: boolean;
}

export default function TestCaseInput({
  onSubmit,
  isLoading,
  inputHint = '테스트할 입력값을 입력하세요',
  disabled = false,
}: TestCaseInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !isLoading && !disabled) {
      onSubmit(trimmed);
    }
  }, [input, isLoading, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">테스트 입력</h3>
        <p className="text-gray-500 text-sm mb-3">{inputHint}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 5, [1, 2, 3], 'hello'"
            disabled={isLoading || disabled}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || disabled || !input.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                검증 중...
              </>
            ) : (
              '실행 & 검증'
            )}
          </button>
        </form>
        <p className="text-gray-500 text-xs mt-2">
          숫자, 문자열, 리스트, 튜플, 딕셔너리 등 Python 리터럴 형식으로 입력하세요.
        </p>
      </div>
    </div>
  );
}
