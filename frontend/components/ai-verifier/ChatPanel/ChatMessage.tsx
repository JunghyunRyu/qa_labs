'use client';

/**
 * ChatMessage Component
 *
 * 채팅 메시지 버블을 렌더링합니다.
 * - 마크다운 지원
 * - 코드 블록 커스텀 렌더링
 * - 스트리밍 커서 표시
 */

import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isPrescripted?: boolean;
  };
  isStreaming?: boolean;
  onApplyCode: (code: string) => void;
}

export default function ChatMessage({
  message,
  isStreaming,
  onApplyCode,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  // 인라인 코드
                  if (!match) {
                    return (
                      <code className="bg-gray-700 px-1 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }

                  // 코드 블록
                  return (
                    <CodeBlock
                      code={codeString}
                      language={match[1]}
                      onApply={onApplyCode}
                      showApplyButton={!isStreaming}
                    />
                  );
                },
                // 마크다운 스타일 오버라이드
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* 스트리밍 커서 */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1" />
            )}
          </div>
        )}

        {/* 프리스크립트 표시 */}
        {message.isPrescripted && (
          <span className="text-xs text-gray-500 mt-1 block">
            (사전 정의된 응답)
          </span>
        )}
      </div>
    </div>
  );
}
