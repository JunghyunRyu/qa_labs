"use client";

import { useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import AIMessage from "./AIMessage";
import type { AIMessage as AIMessageType } from "@/types/ai";

interface AIConversationListProps {
  messages: AIMessageType[];
  loading?: boolean;
}

export default function AIConversationList({
  messages,
  loading = false,
}: AIConversationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-sky-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          AI 코치에게 질문해 보세요!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          테스트 케이스 작성, 경계값 분석, 버그 찾기 등에 대해 힌트를 드릴게요.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <AIMessage key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>생각 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
