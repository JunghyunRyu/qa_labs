/**
 * TestPointItem - 테스트 포인트 항목 (M5-2)
 * 각 테스트 포인트 옆에 "AI로 보내기" 버튼 표시
 * 인라인 마크다운(코드, 볼드 등) 지원
 *
 * UX 개선 (Flying Element + 발견성 강화)
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles, Check, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isFlying, setIsFlying] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSendToAI = useCallback(() => {
    // Flying 애니메이션 시작
    setIsFlying(true);

    // 애니메이션 후 AI 채팅 열기
    setTimeout(() => {
      // 프롬프트 템플릿 적용
      const prompt = applyTemplate("testPointExplain", { content });

      // AI 채팅 열고 메시지 prefill + 원문 컨텍스트 전달
      openAIChatWithPrefill(prompt, content);

      // 전송 피드백 표시
      setIsSent(true);
      setIsFlying(false);
      setTimeout(() => setIsSent(false), 2000);
    }, 400); // Flying 애니메이션 시간
  }, [content, openAIChatWithPrefill]);

  return (
    <div className={`group flex items-start gap-2 relative ${className}`}>
      {/* 체크박스 아이콘 - 체크리스트 스타일 */}
      <Square className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />

      {/* 테스트 포인트 내용 - 다크모드 텍스트 */}
      <div className="flex-1 text-sm text-slate-300 leading-relaxed [&>p]:inline [&>p]:m-0">
        <ReactMarkdown
          components={{
            // 인라인 코드
            code: ({ children }) => (
              <code className="px-1 py-0.5 bg-slate-700 text-slate-200 rounded text-xs font-mono">
                {children}
              </code>
            ),
            // 볼드
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-100">
                {children}
              </strong>
            ),
            // 이탤릭
            em: ({ children }) => (
              <em className="italic text-slate-300">{children}</em>
            ),
            // 문단을 인라인으로
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* AI로 보내기 버튼 - 발견성 개선: 은은한 펄스 효과 + hover 시 강조 */}
      <button
        ref={buttonRef}
        onClick={handleSendToAI}
        disabled={isFlying}
        className={`
          flex-shrink-0 p-1.5 rounded-md transition-all duration-200 relative
          ${isSent
            ? "opacity-100 bg-green-500/20 ring-1 ring-green-500/50"
            : isFlying
            ? "opacity-100 bg-purple-500/30"
            : "opacity-40 group-hover:opacity-100 hover:bg-purple-500/20 hover:ring-1 hover:ring-purple-500/50"
          }
        `}
        title="✨ AI에게 질문하기"
        aria-label={`"${content}" 테스트 포인트에 대해 AI에게 질문하기`}
      >
        {isSent ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Sparkles className={`w-4 h-4 text-purple-400 ${!isFlying && "group-hover:animate-pulse"}`} />
        )}
      </button>

      {/* Flying Element 애니메이션 */}
      <AnimatePresence>
        {isFlying && (
          <motion.div
            initial={{ opacity: 1, scale: 1, x: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [1, 0.8, 0.5],
              x: [0, 100, 200],
              y: [0, -20, -10],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute right-0 top-0 pointer-events-none z-50"
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-full shadow-lg">
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
