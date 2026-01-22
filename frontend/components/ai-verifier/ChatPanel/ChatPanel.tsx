'use client';

/**
 * ChatPanel Component
 *
 * AI Verifier Track용 채팅 패널입니다.
 * - 메시지 목록
 * - 스트리밍 표시
 * - 입력창
 */

import { useEffect, useRef } from 'react';
import { useAIChat } from '@/hooks/ai-verifier/useAIChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  challengeId: string;
  challengeLevel: number;
  onApplyCode: (code: string) => void;
  missionDescription?: string;
  functionName?: string;
  bugType?: string;
}

export default function ChatPanel({
  challengeId,
  challengeLevel,
  onApplyCode,
  missionDescription,
  functionName,
  bugType,
}: ChatPanelProps) {
  const {
    messages,
    sendMessage,
    streamingState,
    streamingContent,
    error,
    isLoading,
  } = useAIChat({ challengeId, challengeLevel });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 미션 정보 */}
        {missionDescription && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-2">미션</h2>
            <p className="text-gray-300">{missionDescription}</p>
          </div>
        )}

        {/* 함수 정보 */}
        {(functionName || bugType) && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-md font-medium text-white mb-2">함수 정보</h3>
            {functionName && (
              <p className="text-gray-400 text-sm">
                함수명: <code className="bg-gray-700 px-1 rounded">{functionName}</code>
              </p>
            )}
            {bugType && (
              <p className="text-gray-400 text-sm mt-1">
                버그 유형: <span className="text-orange-400">{bugType}</span>
              </p>
            )}
          </div>
        )}

        {/* 안내 메시지 (메시지가 없을 때) */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">AI에게 코드 작성을 요청하세요!</p>
            <p className="text-sm">
              예: &quot;함수 만들어줘&quot;, &quot;코드 작성해줘&quot;
            </p>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onApplyCode={onApplyCode}
          />
        ))}

        {/* 스트리밍 중인 메시지 */}
        {streamingState === 'streaming' && streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
            }}
            isStreaming
            onApplyCode={onApplyCode}
          />
        )}

        {/* 로딩 표시 */}
        {streamingState === 'connecting' && (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="animate-pulse">AI가 생각하는 중...</span>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder={
          challengeLevel <= 3
            ? '명령어를 입력하세요 (예: "함수 만들어줘")'
            : 'AI에게 질문하세요...'
        }
      />
    </div>
  );
}
