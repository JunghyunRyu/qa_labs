"use client";

import { useState, useCallback, useEffect } from "react";
import { Bot, X, Sparkles, Lightbulb, Search, FileText, Lock } from "lucide-react";
import { ConversionModal } from "@/components/conversion";
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
import {
  trackGuestAIChatStart,
  trackGuestAILimitReached,
  trackGuestAIConversionClick,
} from "@/lib/analytics";

// 게스트 세션당 무료 사용 횟수
const GUEST_FREE_LIMIT = 3;
const GUEST_USAGE_KEY = "qa_guest_ai_count";

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
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

  // 게스트 사용 횟수 관리
  const [guestUsageCount, setGuestUsageCount] = useState(0);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);

  // 게스트 사용 횟수 로드
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const count = sessionStorage.getItem(GUEST_USAGE_KEY);
        setGuestUsageCount(count ? parseInt(count, 10) : 0);
      } catch {
        setGuestUsageCount(0);
      }
    }
  }, [isAuthenticated]);

  // 게스트 사용 횟수 증가
  const incrementGuestUsage = useCallback(() => {
    const newCount = guestUsageCount + 1;
    setGuestUsageCount(newCount);
    try {
      sessionStorage.setItem(GUEST_USAGE_KEY, String(newCount));
    } catch {
      // sessionStorage 접근 실패 무시
    }
    // GA 이벤트: 사용 횟수 추적
    trackGuestAIChatStart({ problemId: String(problemId), usageCount: newCount });
    // 3회 도달 시 제한 이벤트
    if (newCount >= GUEST_FREE_LIMIT) {
      trackGuestAILimitReached({ problemId: String(problemId) });
    }
  }, [guestUsageCount, problemId]);

  // 게스트 제한 도달 여부
  const isGuestLimitReached = !isAuthenticated && guestUsageCount >= GUEST_FREE_LIMIT;

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

      // 게스트 제한 초과 시 메시지 전송 차단
      if (isGuestLimitReached) {
        setShowGuestLimitModal(true);
        return;
      }

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

        // 게스트인 경우 사용 횟수 증가
        if (!isAuthenticated) {
          incrementGuestUsage();
        }

        // 게스트 3회 초과 시 (4번째 메시지) - 블러 처리
        const shouldBlur = !isAuthenticated && guestUsageCount >= GUEST_FREE_LIMIT - 1;

        // Replace temp message with real one and add AI response
        const aiMessage: AIMessage = {
          id: response.message_id,
          role: "assistant",
          content: response.reply,
          created_at: new Date().toISOString(),
          isBlurred: shouldBlur, // 블러 플래그
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

        // 블러 처리된 경우 전환 모달 표시
        if (shouldBlur) {
          setShowGuestLimitModal(true);
        }
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
    [problemId, mode, codeContext, conversationId, isAuthenticated, isGuestLimitReached, guestUsageCount, incrementGuestUsage]
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
      ) : (
        <>
          {/* Conversation History Selector - 회원만 */}
          {isAuthenticated && (
            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <AIConversationHistory
                problemId={problemId}
                currentConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </div>
          )}

          {/* 메시지가 없을 때: Conversation Starters */}
          {messages.length === 0 && !isLoading && !isLoadingHistory ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 font-medium mb-2">
                무엇을 도와드릴까요?
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 text-center">
                아래 버튼을 클릭하거나 직접 질문해보세요
              </p>

              {/* Conversation Starter Chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                <button
                  onClick={() => handleSendMessage("이 문제를 어떻게 접근해야 할까요?")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  힌트 주세요
                </button>
                <button
                  onClick={() => handleSendMessage("내 코드에서 버그를 찾아줘")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  버그 찾기
                </button>
                <button
                  onClick={() => handleSendMessage("이 문제의 핵심 개념이 뭐야?")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  핵심 개념
                </button>
              </div>

              {/* 게스트 남은 횟수 표시 */}
              {!isAuthenticated && (
                <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
                  무료 체험: {Math.max(0, GUEST_FREE_LIMIT - guestUsageCount)}회 남음
                </p>
              )}
            </div>
          ) : (
            /* 메시지가 있을 때: 대화 목록 */
            <AIConversationList messages={messages} loading={isLoading || isLoadingHistory} />
          )}

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50/80 dark:bg-red-950/20 border-t border-red-200/60 dark:border-red-800/50">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Save Policy Notice / 게스트 남은 횟수 */}
          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              {isAuthenticated
                ? "대화 기록이 자동 저장됩니다"
                : `무료 체험: ${Math.max(0, GUEST_FREE_LIMIT - guestUsageCount)}회 남음`}
            </p>
          </div>

          {/* Quick Prompts (M5-3) */}
          {promptContext && messages.length > 0 && (
            <QuickPromptBar
              context={promptContext}
              onSelectPrompt={handleSendMessage}
              disabled={isLoading || isGuestLimitReached}
            />
          )}

          {/* Input */}
          <AIMessageInput
            onSend={handleSendMessage}
            loading={isLoading}
            disabled={isOff || isGuestLimitReached}
            prefillMessage={aiChatPrefillMessage}
            onPrefillConsumed={() => setAIChatPrefillMessage(null)}
          />

          {/* 게스트 제한 시 입력창 위에 오버레이 */}
          {isGuestLimitReached && (
            <div className="px-4 py-3 bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    무료 체험이 끝났습니다
                  </span>
                </div>
                <button
                  onClick={() => {
                    trackGuestAIConversionClick({ problemId: String(problemId), trigger: "limit_modal" });
                    setIsConversionModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  가입하고 계속하기
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Guest Limit Modal (블러 답변 후) */}
      {showGuestLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                AI 코치가 마음에 드셨나요?
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                가입하면 더 많은 AI 코칭을 받을 수 있어요.<br />
                무료 플랜으로 시작해보세요!
              </p>
              <button
                onClick={() => {
                  trackGuestAIConversionClick({ problemId: String(problemId), trigger: "blur_answer" });
                  setShowGuestLimitModal(false);
                  setIsConversionModalOpen(true);
                }}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium mb-3"
              >
                가입하여 계속하기
              </button>
              <button
                onClick={() => setShowGuestLimitModal(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConversionModal */}
      <ConversionModal
        isOpen={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        feature="ai_coach"
      />

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
