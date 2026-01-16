/**
 * TestPointsList - 테스트 포인트 목록 (M5-2)
 * 마크다운 summary에서 테스트 포인트를 추출하여 AI 버튼과 함께 표시
 */

"use client";

import React from "react";
import { Square } from "lucide-react";
import TestPointItem from "./TestPointItem";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface TestPointsListProps {
  content: string;
  className?: string;
}

/**
 * 마크다운 컨텐츠에서 테스트 포인트를 추출하고 AI 버튼과 함께 렌더링
 * 불릿 아이템은 TestPointItem으로, 나머지는 일반 마크다운으로 렌더링
 */
export default function TestPointsList({ content, className = "" }: TestPointsListProps) {
  return (
    <div className={`prose prose-sm prose-invert max-w-none text-slate-300 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // 불릿 리스트: 커스텀 스타일
          ul: ({ children }) => (
            <ul className="space-y-1 my-1.5 ml-0 list-none">
              {children}
            </ul>
          ),
          // 순서 리스트
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 ml-1 text-sm text-slate-300">
              {children}
            </ol>
          ),
          // 리스트 아이템: TestPointItem 사용
          li: ({ children }) => {
            // children에서 텍스트 추출
            const textContent = extractTextFromChildren(children);

            if (textContent) {
              return (
                <li className="list-none">
                  <TestPointItem content={textContent} />
                </li>
              );
            }

            // fallback: 체크리스트 스타일
            return (
              <li className="text-slate-300 leading-relaxed text-sm flex items-start gap-2">
                <Square className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="[&>p]:inline [&>p]:mb-0">{children}</span>
              </li>
            );
          },
          // 문단 - 인라인 불릿(•)이 있으면 분리해서 AI 버튼 추가
          p: ({ children }) => {
            const textContent = extractTextFromChildren(children);

            // 인라인 불릿 포인트가 있는지 확인 (• 문자로 분리)
            if (textContent.includes("•")) {
              const parts = textContent.split(/•/).filter(Boolean);

              // 첫 부분은 헤더일 수 있음 (예: "📏 경계값 분석")
              const headerPart = parts[0]?.trim();
              const bulletParts = parts.slice(1).map(p => p.trim()).filter(Boolean);

              if (bulletParts.length > 0) {
                return (
                  <div className="mb-1.5">
                    {headerPart && (
                      <p className="leading-relaxed text-slate-200 text-sm font-medium mb-1">
                        {headerPart}
                      </p>
                    )}
                    <div className="space-y-1.5 ml-1">
                      {bulletParts.map((point, idx) => (
                        <TestPointItem key={idx} content={point} />
                      ))}
                    </div>
                  </div>
                );
              }
            }

            // 불릿이 없는 일반 문단
            return (
              <p className="mb-1.5 leading-relaxed text-slate-300 text-sm last:mb-0">
                {children}
              </p>
            );
          },
          // 강조
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-100">
              {children}
            </strong>
          ),
          // 인라인 코드
          code: ({ children }) => (
            <code className="px-1 py-0.5 bg-slate-700 text-slate-200 rounded text-xs font-mono">
              {children}
            </code>
          ),
          // 헤더는 숨김 (summary에서는 불필요)
          h1: () => null,
          h2: () => null,
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1 text-slate-200">
              {children}
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * React children에서 순수 텍스트 추출
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children
      .map((child) => extractTextFromChildren(child))
      .join("");
  }

  // React element인 경우
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractTextFromChildren(props.children);
  }

  return "";
}
