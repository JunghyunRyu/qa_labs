"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, MessageSquare, Plus, Loader2 } from "lucide-react";
import { getAIConversations } from "@/lib/api/ai";
import type { AIConversationSummary } from "@/types/ai";

interface AIConversationHistoryProps {
  problemId: number;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewConversation: () => void;
}

export default function AIConversationHistory({
  problemId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: AIConversationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch conversations when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, problemId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAIConversations(problemId);
      setConversations(response.conversations);
    } catch (err) {
      setError("대화 목록을 불러올 수 없습니다.");
      console.error("Failed to fetch conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    setIsOpen(false);
  };

  const handleNewConversation = () => {
    onNewConversation();
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate text-gray-700 dark:text-gray-300">
            {currentConversationId
              ? currentConversation?.preview || "현재 대화"
              : "새 대화"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* New Conversation Button */}
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 border-b border-gray-200 dark:border-gray-700"
          >
            <Plus className="w-4 h-4" />
            <span>새 대화 시작</span>
          </button>

          {/* Conversation List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-sm text-center text-red-500">
                {error}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                이전 대화가 없습니다
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelect(conversation.id)}
                  className={`w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                    conversation.id === currentConversationId
                      ? "bg-sky-50 dark:bg-sky-900/20"
                      : ""
                  }`}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate w-full">
                    {conversation.preview || "대화"}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {formatDate(conversation.updated_at)}
                    {conversation.message_count > 0 && (
                      <span className="ml-2">
                        메시지 {conversation.message_count}개
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
