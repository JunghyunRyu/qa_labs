/**
 * TestPointItem - 테스트 포인트 항목 (M5-2)
 * 각 테스트 포인트 옆에 "AI로 보내기" 버튼 표시
 * 인라인 마크다운(코드, 볼드 등) 지원
 */

"use client";

import { useState, useCallback } from "react";
import { Sparkles, Check } from "lucide-react";
import { useLayoutStore } from "@/stores/layoutStore";
import { applyTemplate } from "@/lib/promptTemplates";
import ReactMarkdown from "react-markdown";

interface TestPointItemProps {
  content: string;
  className?: string;
}

export default function TestPointItem({ content, className = "" }: TestPointItemProps) {
  const { openAIChatWithPrefill } = useLayoutStore();
  const [isSent, setIsSent] = useState(false);

  const handleSendToAI = useCallback(() => {
    // 프롬프트 템플릿 적용
    const prompt = applyTemplate("testPointExplain", { content });

    // AI 채팅 열고 메시지 prefill
    openAIChatWithPrefill(prompt);

    // 전송 피드백 표시
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
  }, [content, openAIChatWithPrefill]);

  return (
    <div className={`group flex items-start gap-2 ${className}`}>
      {/* 테스트 포인트 내용 - 인라인 마크다운 렌더링 */}
      <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&>p]:inline [&>p]:m-0">
        <ReactMarkdown
          components={{
            // 인라인 코드
            code: ({ children }) => (
              <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                {children}
              </code>
            ),
            // 볼드
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                {children}
              </strong>
            ),
            // 이탤릭
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            // 문단을 인라인으로
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* AI로 보내기 버튼 - hover 시 표시 */}
      <button
        onClick={handleSendToAI}
        className={`
          flex-shrink-0 p-1 rounded transition-all duration-200
          ${isSent
            ? "opacity-100 bg-green-100 dark:bg-green-900/30"
            : "opacity-0 group-hover:opacity-100 hover:bg-purple-100 dark:hover:bg-purple-900/30"
          }
        `}
        title="AI에게 질문하기"
        aria-label={`"${content}" 테스트 포인트에 대해 AI에게 질문하기`}
      >
        {isSent ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Sparkles className="w-4 h-4 text-purple-500" />
        )}
      </button>
    </div>
  );
}

/**
 * 마크다운 텍스트에서 테스트 포인트(bullet items) 추출
 */
export function extractTestPoints(markdown: string): string[] {
  const points: string[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // 불릿 포인트 패턴: "- ", "* ", "• " 로 시작하는 줄
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (bulletMatch) {
      points.push(bulletMatch[1].trim());
    }
  }

  return points;
}
