"use client";

import { useState, useCallback, useEffect } from "react";
import { Bot, X, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { sendAIMessage, getAIConversation } from "@/lib/api/ai";
import { ApiError } from "@/lib/api";
import AIConversationList from "./AIConversationList";
import AIMessageInput from "./AIMessageInput";
import AIConversationHistory from "./AIConversationHistory";
import type { AIMessage, AIChatMode } from "@/types/ai";

interface AICoachPanelProps {
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
  onClose?: () => void;
  className?: string;
}

export default function AICoachPanel({
  problemId,
  codeContext,
  mode,
  onModeChange,
  onClose,
  className = "",
}: AICoachPanelProps) {
  const { user, isAuthenticated, login } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      className={`flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-sky-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            AI 코치
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <button
            onClick={() => onModeChange(isOff ? "COACH" : "OFF")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOff
                ? "bg-gray-300 dark:bg-gray-600"
                : "bg-sky-500"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOff ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isOff ? "OFF" : "ON"}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isOff ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Bot className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI 코치가 꺼져 있습니다
          </p>
          <button
            onClick={() => onModeChange("COACH")}
            className="mt-3 text-sm text-sky-500 hover:text-sky-600"
          >
            켜기
          </button>
        </div>
      ) : (
        <>
          {/* Conversation History Selector - Members only */}
          {isAuthenticated && (
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <AIConversationHistory
                problemId={problemId}
                currentConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </div>
          )}

          {/* Messages */}
          <AIConversationList messages={messages} loading={isLoading || isLoadingHistory} />

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Save Policy Notice */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {isAuthenticated ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                대화 기록이 자동 저장됩니다
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  로그인하면 대화 기록이 저장됩니다
                </p>
                <button
                  onClick={login}
                  className="inline-flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600"
                >
                  <LogIn className="w-3 h-3" />
                  로그인
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <AIMessageInput
            onSend={handleSendMessage}
            loading={isLoading}
            disabled={isOff}
          />
        </>
      )}
    </div>
  );
}
