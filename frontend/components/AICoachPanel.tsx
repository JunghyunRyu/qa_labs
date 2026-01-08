"use client";

import { useState, useCallback, useEffect } from "react";
import { Bot, X, LogIn, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLayoutStore } from "@/stores/layoutStore";
import { sendAIMessage, getAIConversation } from "@/lib/api/ai";
import { ApiError } from "@/lib/api";
import AIConversationList from "./AIConversationList";
import AIMessageInput from "./AIMessageInput";
import AIConversationHistory from "./AIConversationHistory";
import TokenExhaustedModal from "./TokenExhaustedModal";
import QuickPromptBar from "./ai/QuickPromptBar";
import type { AIMessage, AIChatMode } from "@/types/ai";
import type { PromptContext } from "@/lib/quickPrompts";

interface AICoachPanelProps {
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
  onClose?: () => void;
  className?: string;
  promptContext?: PromptContext; // M5-3: 빠른 질문용 컨텍스트
}

export default function AICoachPanel({
  problemId,
  codeContext,
  mode,
  onModeChange,
  onClose,
  className = "",
  promptContext,
}: AICoachPanelProps) {
  const { user, isAuthenticated, login } = useAuth();
  const { aiChatPrefillMessage, setAIChatPrefillMessage } = useLayoutStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExhausted, setTokenExhausted] = useState<{
    tokensRemaining: number;
    dailyBonusRemaining: number;
    nextReset: string | null;
  } | null>(null);

  // Reset conversation when problem changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, [problemId]);

  // Load a previous conversation
  const handleSelectConversation = useCallback(async (selectedConversationId: string | null) => {
    if (!selectedConversationId) {
      // Start new conversation
      setMessages([]);
      setConversationId(null);
      setError(null);
      return;
    }

    setIsLoadingHistory(true);
    setError(null);
    try {
      const conversation = await getAIConversation(selectedConversationId);
      setConversationId(conversation.id);
      setMessages(
        conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          created_at: msg.created_at,
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("대화를 불러올 수 없습니다.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Start a new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (mode === "OFF") return;

      setError(null);
      setIsLoading(true);

      // Optimistic UI update - add user message immediately
      const tempUserMessage: AIMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        const response = await sendAIMessage({
          problem_id: problemId,
          mode,
          message: content,
          code_context: codeContext,
          conversation_id: conversationId || undefined,
        });

        // Update conversation ID for subsequent messages
        if (!conversationId) {
          setConversationId(response.conversation_id);
        }

        // Replace temp message with real one and add AI response
        const aiMessage: AIMessage = {
          id: response.message_id,
          role: "assistant",
          content: response.reply,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => {
          // Replace the temp user message with a permanent ID
          const updated = prev.map((msg) =>
            msg.id === tempUserMessage.id
              ? { ...msg, id: `user-${Date.now()}` }
              : msg
          );
          return [...updated, aiMessage];
        });
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== tempUserMessage.id)
        );

        if (err instanceof ApiError) {
          if (err.status === 429) {
            setError(
              "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
            );
          } else if (err.status === 402) {
            // Token exhausted (token-policy.md §8.2 표준 에러 규격)
            const errorData = err.data as {
              detail?: {
                error?: {
                  code?: string;
                  details?: {
                    daily_free_remaining?: number;
                    monthly_remaining?: number;
                    next_monthly_reset_at?: string;
                  };
                };
                // Legacy format fallback
                tokens_remaining?: number;
                daily_bonus_remaining?: number;
                next_reset?: string;
              };
            } | undefined;

            const details = errorData?.detail?.error?.details;
            const legacy = errorData?.detail;

            setTokenExhausted({
              tokensRemaining: details?.monthly_remaining ?? legacy?.tokens_remaining ?? 0,
              dailyBonusRemaining: details?.daily_free_remaining ?? legacy?.daily_bonus_remaining ?? 0,
              nextReset: details?.next_monthly_reset_at ?? legacy?.next_reset ?? null,
            });
          } else {
            const errorData = err.data as { detail?: string } | undefined;
            setError(errorData?.detail || "오류가 발생했습니다.");
          }
        } else {
          setError("네트워크 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [problemId, mode, codeContext, conversationId]
  );

  const isOff = mode === "OFF";

  return (
    <div
      className={`flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            AI 도우미
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <button
            onClick={() => onModeChange(isOff ? "COACH" : "OFF")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOff
                ? "bg-neutral-300 dark:bg-neutral-600"
                : "bg-purple-600 dark:bg-purple-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOff ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {isOff ? "OFF" : "ON"}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isOff ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
            <Bot className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            AI 도우미가 꺼져 있습니다
          </p>
          <button
            onClick={() => onModeChange("COACH")}
            className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            켜기
          </button>
        </div>
      ) : !isAuthenticated ? (
        /* Members-only login prompt */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            회원 전용 기능
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            AI 도우미는 로그인 후 이용할 수 있습니다
          </p>
          <button
            onClick={() => login()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            로그인
          </button>
        </div>
      ) : (
        <>
          {/* Conversation History Selector */}
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <AIConversationHistory
              problemId={problemId}
              currentConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          {/* Messages */}
          <AIConversationList messages={messages} loading={isLoading || isLoadingHistory} />

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50/80 dark:bg-red-950/20 border-t border-red-200/60 dark:border-red-800/50">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Save Policy Notice */}
          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              대화 기록이 자동 저장됩니다
            </p>
          </div>

          {/* Quick Prompts (M5-3) */}
          {promptContext && (
            <QuickPromptBar
              context={promptContext}
              onSelectPrompt={handleSendMessage}
              disabled={isLoading}
            />
          )}

          {/* Input */}
          <AIMessageInput
            onSend={handleSendMessage}
            loading={isLoading}
            disabled={isOff}
            prefillMessage={aiChatPrefillMessage}
            onPrefillConsumed={() => setAIChatPrefillMessage(null)}
          />
        </>
      )}

      {/* Token Exhausted Modal */}
      {tokenExhausted && (
        <TokenExhaustedModal
          isOpen={true}
          onClose={() => setTokenExhausted(null)}
          tokensRemaining={tokenExhausted.tokensRemaining}
          dailyBonusRemaining={tokenExhausted.dailyBonusRemaining}
          nextReset={tokenExhausted.nextReset}
        />
      )}
    </div>
  );
}
