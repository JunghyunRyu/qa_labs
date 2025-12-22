"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLayoutStore } from "@/stores/layoutStore";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  Info,
  Code2,
} from "lucide-react";
import { Problem } from "@/types/problem";
import TagChips from "@/components/TagChips";
import CopyButton from "@/components/CopyButton";
import Accordion from "@/components/ui/Accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Difficulty color mapping
const difficultyColors: Record<string, string> = {
  "Very Easy": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Easy": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Hard": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface ProblemPanelProps {
  problem: Problem;
}

interface ParsedSection {
  type: 'overview' | 'function' | 'examples' | 'exceptions' | 'hints' | 'task' | 'constraints' | 'io' | 'other';
  title: string;
  content: string;
}

// Parse markdown into structured sections
function parseDescription(md: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = md.split('\n');

  let currentSection: ParsedSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Header detection (## or ###)
    if (line.startsWith('##') && !line.startsWith('###')) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }

      const title = line.replace(/^#+\s*/, '').trim();
      currentContent = [];

      // Determine section type
      let type: ParsedSection['type'] = 'other';
      const titleLower = title.toLowerCase();

      if (titleLower.includes('문제 설명') || titleLower.includes('개요') || titleLower.includes('description')) {
        type = 'overview';
      } else if (titleLower.includes('함수') || titleLower.includes('시그니처') || titleLower.includes('signature')) {
        type = 'function';
      } else if (titleLower.includes('예시') || titleLower.includes('동작 예시') || titleLower.includes('정상') || titleLower.includes('example')) {
        type = 'examples';
      } else if (titleLower.includes('예외') || titleLower.includes('에러') || titleLower.includes('오류') || titleLower.includes('error')) {
        type = 'exceptions';
      } else if (titleLower.includes('힌트') || titleLower.includes('고려') || titleLower.includes('아이디어') || titleLower.includes('hint')) {
        type = 'hints';
      } else if (titleLower.includes('과제') || titleLower.includes('해야') || titleLower.includes('수험자') || titleLower.includes('task')) {
        type = 'task';
      } else if (titleLower.includes('제약') || titleLower.includes('조건') || titleLower.includes('constraint')) {
        type = 'constraints';
      } else if (titleLower.includes('입력') || titleLower.includes('출력') || titleLower.includes('input') || titleLower.includes('output')) {
        type = 'io';
      }

      currentSection = { type, title, content: '' };
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  // If no sections found, treat entire content as overview
  if (sections.length === 0) {
    sections.push({ type: 'overview', title: '문제 설명', content: md });
  }

  return sections;
}

// Extract summary (first 3 meaningful lines)
function extractSummary(md: string): string {
  const lines = md
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .slice(0, 3);
  return lines.join('\n');
}

// Section config for icons and colors
function getSectionConfig(type: ParsedSection['type']) {
  switch (type) {
    case 'overview':
      return { icon: Info, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    case 'function':
      return { icon: Code2, iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' };
    case 'examples':
      return { icon: CheckCircle, iconColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' };
    case 'exceptions':
      return { icon: XCircle, iconColor: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    case 'hints':
      return { icon: Lightbulb, iconColor: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    case 'task':
      return { icon: Target, iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' };
    case 'constraints':
      return { icon: AlertTriangle, iconColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' };
    case 'io':
      return { icon: Code2, iconColor: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' };
    default:
      return { icon: FileText, iconColor: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800' };
  }
}

// Markdown content renderer
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: () => null,
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1.5 text-gray-800 dark:text-gray-200">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-0.5 my-1.5 ml-1 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-0.5 my-1.5 ml-1 text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm [&>p]:inline [&>p]:mb-0">
              {children}
            </li>
          ),
          p: ({ children }) => (
            <p className="mb-1.5 leading-relaxed text-gray-700 dark:text-gray-300 text-sm last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (className) {
              const codeText = String(children).replace(/\n$/, '');
              return (
                <div className="my-2 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                  <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 border-b border-gray-700">
                    <span className="text-xs text-gray-400 font-mono uppercase">
                      {language || 'code'}
                    </span>
                    <CopyButton text={codeText} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <pre className="text-xs text-gray-100 font-mono leading-relaxed">
                      <code {...props} className={className}>{children}</code>
                    </pre>
                  </div>
                </div>
              );
            }
            return (
              <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  const { isProblemCollapsed, toggleProblemPanel } = useLayoutStore();

  // Parse sections from description
  const sections = useMemo(() => parseDescription(problem.description_md), [problem.description_md]);

  // Extract summary for sticky area
  const summary = useMemo(() => extractSummary(problem.description_md), [problem.description_md]);

  // Separate sticky sections (overview, io, constraints) from accordion sections
  const stickyTypes = new Set(['overview', 'io', 'constraints', 'task']);
  const stickySections = sections.filter(s => stickyTypes.has(s.type));
  const accordionSections = sections.filter(s => !stickyTypes.has(s.type));

  // Collapsed state - minimal vertical bar
  if (isProblemCollapsed) {
    return (
      <div
        data-testid="problem-panel-collapsed"
        className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2"
      >
        <button
          data-testid="btn-expand-problem"
          onClick={toggleProblemPanel}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                     bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600
                     transition-colors group"
          aria-label="문제 패널 펼치기"
          title="문제 패널 펼치기 (Ctrl+B)"
        >
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
        </button>

        <div className="mt-3 flex flex-col items-center gap-1">
          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 writing-mode-vertical whitespace-nowrap">
            문제
          </span>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div
      data-testid="problem-panel"
      className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* ===== STICKY AREA ===== */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-gray-900">
        {/* Header with Back Link */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <Link
              href="/problems"
              className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>문제 목록</span>
            </Link>
            <button
              data-testid="btn-collapse-problem"
              onClick={toggleProblemPanel}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="문제 패널 접기"
              title="문제 패널 접기 (Ctrl+B)"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate flex-1">
              {problem.title}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                difficultyColors[problem.difficulty] || difficultyColors["Medium"]
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
          {problem.skills && problem.skills.length > 0 && (
            <div className="mt-1">
              <TagChips tags={problem.skills} maxVisible={3} size="sm" />
            </div>
          )}
        </div>

        {/* Function Signature - Always visible */}
        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                함수 시그니처
              </span>
            </div>
            <CopyButton text={problem.function_signature} />
          </div>
          <pre className="text-sm text-purple-900 dark:text-purple-100 font-mono bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-700 overflow-x-auto">
            {problem.function_signature}
          </pre>
        </div>

        {/* Summary - Quick glance (3 lines) */}
        <div className="px-3 py-2 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
              핵심 요약
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {summary || "문제 설명을 확인하세요."}
          </p>
        </div>

        {/* Sticky Sections: Constraints, IO, Task */}
        {stickySections.filter(s => s.type !== 'overview').length > 0 && (
          <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800/30">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                주의사항 / 제약조건
              </span>
            </div>
            <div className="space-y-1">
              {stickySections
                .filter(s => s.type !== 'overview')
                .map((section, idx) => (
                  <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    <MarkdownContent content={section.content} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== SCROLLABLE ACCORDION AREA ===== */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {accordionSections.map((section, index) => {
          const config = getSectionConfig(section.type);
          const Icon = config.icon;

          // Default open for examples, closed for hints
          const defaultOpen = section.type === 'examples';

          return (
            <Accordion
              key={index}
              title={section.title}
              icon={Icon}
              iconColor={config.iconColor}
              bgColor={config.bgColor}
              defaultOpen={defaultOpen}
            >
              <MarkdownContent content={section.content} />
            </Accordion>
          );
        })}

        {/* If no accordion sections, show full overview */}
        {accordionSections.length === 0 && stickySections.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            모든 정보가 상단에 표시되어 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}
