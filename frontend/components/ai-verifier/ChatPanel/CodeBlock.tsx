'use client';

/**
 * CodeBlock Component
 *
 * 채팅 메시지 내 코드 블록을 렌더링합니다.
 * - Syntax highlighting
 * - Copy 버튼
 * - Apply to Editor 버튼
 */

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
  onApply: (code: string) => void;
  showApplyButton?: boolean;
}

export default function CodeBlock({
  code,
  language,
  onApply,
  showApplyButton = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '14px',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {/* 버튼 그룹 */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        {showApplyButton && (
          <button
            onClick={() => onApply(code)}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors flex items-center gap-1"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
