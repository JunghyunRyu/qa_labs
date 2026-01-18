/**
 * QuickPromptBar - AI 퀵 프롬프트 버튼 바 (M5-3)
 *
 * 4가지 빠른 질문 버튼 제공:
 * - 스펙 요약, 테스트 제안, 놓친 이유, 로그 분석
 */

"use client";

import { useMemo } from "react";
import {
  QUICK_PROMPTS,
  fillPromptTemplate,
  getPromptAvailability,
  type PromptContext,
  type QuickPrompt,
} from "@/lib/quickPrompts";

interface QuickPromptBarProps {
  context: PromptContext;
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function QuickPromptBar({
  context,
  onSelectPrompt,
  disabled = false,
  className = "",
}: QuickPromptBarProps) {
  // 각 프롬프트의 가용성 계산
  const promptStates = useMemo(() => {
    return QUICK_PROMPTS.map((prompt) => ({
      prompt,
      ...getPromptAvailability(prompt, context),
    }));
  }, [context]);

  const handleClick = (prompt: QuickPrompt, available: boolean) => {
    if (!available || disabled) return;

    const filledPrompt = fillPromptTemplate(prompt.template, context);
    onSelectPrompt(filledPrompt);
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-slate-700 bg-slate-800/50 ${className}`}>
      <span className="text-xs text-slate-400 flex-shrink-0 mr-1">
        빠른 질문:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {promptStates.map(({ prompt, available, reason }) => (
          <button
            key={prompt.id}
            onClick={() => handleClick(prompt, available)}
            disabled={!available || disabled}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full
              border transition-all duration-200
              ${available && !disabled
                ? "border-purple-800/50 text-purple-300 hover:bg-purple-950/30 hover:border-purple-700 cursor-pointer"
                : "border-slate-700 text-slate-500 cursor-not-allowed"
              }
            `}
            title={available ? prompt.description : reason}
            aria-label={`${prompt.label}: ${available ? prompt.description : reason}`}
          >
            <span>{prompt.icon}</span>
            <span className="hidden sm:inline">{prompt.label}</span>
            <span className="sm:hidden">{prompt.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 컴팩트 버전 (더 작은 공간용)
 */
export function QuickPromptBarCompact({
  context,
  onSelectPrompt,
  disabled = false,
  className = "",
}: QuickPromptBarProps) {
  const promptStates = useMemo(() => {
    return QUICK_PROMPTS.map((prompt) => ({
      prompt,
      ...getPromptAvailability(prompt, context),
    }));
  }, [context]);

  const handleClick = (prompt: QuickPrompt, available: boolean) => {
    if (!available || disabled) return;

    const filledPrompt = fillPromptTemplate(prompt.template, context);
    onSelectPrompt(filledPrompt);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {promptStates.map(({ prompt, available, reason }) => (
        <button
          key={prompt.id}
          onClick={() => handleClick(prompt, available)}
          disabled={!available || disabled}
          className={`
            p-1.5 rounded-lg transition-colors
            ${available && !disabled
              ? "text-purple-400 hover:bg-purple-950/30"
              : "text-slate-600 cursor-not-allowed"
            }
          `}
          title={available ? `${prompt.label}: ${prompt.description}` : `${prompt.label}: ${reason}`}
          aria-label={`${prompt.label}: ${available ? prompt.description : reason}`}
        >
          <span className="text-base">{prompt.icon}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * 가로 스크롤 버전 (대화 중에 사용)
 * P3: 컴팩트한 가로 스크롤 형태
 */
export function QuickPromptBarScrollable({
  context,
  onSelectPrompt,
  disabled = false,
  className = "",
}: QuickPromptBarProps) {
  const promptStates = useMemo(() => {
    return QUICK_PROMPTS.map((prompt) => ({
      prompt,
      ...getPromptAvailability(prompt, context),
    }));
  }, [context]);

  const handleClick = (prompt: QuickPrompt, available: boolean) => {
    if (!available || disabled) return;

    const filledPrompt = fillPromptTemplate(prompt.template, context);
    onSelectPrompt(filledPrompt);
  };

  return (
    <div className={`border-t border-slate-700 bg-slate-800/50 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <span className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap">
          빠른 질문
        </span>
        {promptStates.map(({ prompt, available, reason }) => (
          <button
            key={prompt.id}
            onClick={() => handleClick(prompt, available)}
            disabled={!available || disabled}
            className={`
              inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full
              border transition-all duration-200 flex-shrink-0 whitespace-nowrap
              ${available && !disabled
                ? "border-purple-800/50 text-purple-300 hover:bg-purple-950/30 hover:border-purple-700 cursor-pointer"
                : "border-slate-700 text-slate-500 cursor-not-allowed"
              }
            `}
            title={available ? prompt.description : reason}
            aria-label={`${prompt.label}: ${available ? prompt.description : reason}`}
          >
            <span>{prompt.icon}</span>
            <span>{prompt.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
