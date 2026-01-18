"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useTextSelection, clearWindowSelection } from "@/hooks/useTextSelection";
import SelectionActionMenu from "@/components/ai/SelectionActionMenu";
import { generateSelectionPrompt, type SelectionActionType } from "@/lib/selectionPrompts";
import { useLayoutStore, type AccordionSectionType } from "@/stores/layoutStore";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  Info,
  Code2,
  BookOpen,
  Search,
  Sparkles,
} from "lucide-react";
import { Problem } from "@/types/problem";
import TagChips from "@/components/TagChips";
import CopyButton from "@/components/CopyButton";
import Accordion from "@/components/ui/Accordion";
import ProblemSearchBar from "@/components/layout/ProblemSearchBar";
import TestPointsList from "@/components/TestPointsList";
import HintPanel from "@/components/HintPanel";
import { useTextSearch } from "@/hooks/useTextSearch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Difficulty color mapping
const difficultyColors: Record<string, string> = {
  "Very Easy": "bg-blue-900/30 text-blue-300",
  "Easy": "bg-green-900/30 text-green-300",
  "Medium": "bg-yellow-900/30 text-yellow-300",
  "Hard": "bg-red-900/30 text-red-300",
};

interface ProblemPanelProps {
  problem: Problem;
}

interface ParsedSection {
  type: 'overview' | 'function' | 'examples' | 'exceptions' | 'hints' | 'task' | 'constraints' | 'io' | 'strategy' | 'other';
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
      } else if (titleLower.includes('테스트 전략') || titleLower.includes('test strategy')) {
        type = 'strategy';
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

// Extract summary (first 3 meaningful lines) - fallback if no summary field
function extractSummary(md: string): string {
  const lines = md
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .slice(0, 3);
  return lines.join('\n');
}

// Get summary - prefer problem.summary field, fallback to extractSummary
function getSummary(problem: Problem): string {
  if (problem.summary) {
    return problem.summary;
  }
  return extractSummary(problem.description_md);
}

// Section config for icons and colors - unified slate/purple theme
function getSectionConfig(type: ParsedSection['type']) {
  switch (type) {
    case 'overview':
      return { icon: Info, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    case 'function':
      return { icon: Code2, iconColor: 'text-purple-400', bgColor: 'bg-purple-900/20' };
    case 'examples':
      return { icon: CheckCircle, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    case 'exceptions':
      return { icon: XCircle, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    case 'hints':
      return { icon: Lightbulb, iconColor: 'text-purple-400', bgColor: 'bg-purple-900/20' };
    case 'strategy':
      return { icon: Target, iconColor: 'text-purple-400', bgColor: 'bg-purple-900/20' };
    case 'task':
      return { icon: Target, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    case 'constraints':
      return { icon: AlertTriangle, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    case 'io':
      return { icon: Code2, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
    default:
      return { icon: FileText, iconColor: 'text-slate-400', bgColor: 'bg-slate-800/50' };
  }
}

// Markdown content renderer
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-slate-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h2: () => null,
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1.5 text-slate-200">
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
            <li className="text-slate-300 leading-relaxed text-sm [&>p]:inline [&>p]:mb-0">
              {children}
            </li>
          ),
          p: ({ children }) => (
            <p className="mb-1.5 leading-relaxed text-slate-300 text-sm last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-100">{children}</strong>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (className) {
              const codeText = String(children).replace(/\n$/, '');
              return (
                <div className="my-2 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 group">
                  <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5 border-b border-slate-700">
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      {language || 'code'}
                    </span>
                    <CopyButton text={codeText} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <pre className="text-xs text-slate-100 font-mono leading-relaxed">
                      <code {...props} className={className}>{children}</code>
                    </pre>
                  </div>
                </div>
              );
            }
            return (
              <code className="px-1 py-0.5 bg-slate-700 text-slate-200 rounded text-xs font-mono" {...props}>
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
  const {
    isProblemCollapsed,
    toggleProblemPanel,
    toggleProblemPeek,
    isProblemPeekOpen: isExpandedMode,  // 확장 모드 상태
    isProblemSearchOpen,
    closeProblemSearch,
    toggleProblemSearch,
    accordionDefaults,
    openAIChatWithPrefill,
  } = useLayoutStore();

  // Content ref for search highlighting
  const contentRef = useRef<HTMLDivElement>(null);

  // M5-4: Ref for test points section (sticky area)
  const testPointsRef = useRef<HTMLDivElement>(null);

  // M5-4: Text selection for AI questions (both sticky and scrollable areas)
  const accordionSelection = useTextSelection(contentRef, !isProblemCollapsed);
  const testPointsSelection = useTextSelection(testPointsRef, !isProblemCollapsed);

  // Use whichever selection is currently active
  const selection = testPointsSelection.isValid ? testPointsSelection : accordionSelection;

  // Handler for selection action menu (M5-4)
  const handleSelectionAction = useCallback(
    (actionType: SelectionActionType, selectedText: string) => {
      const prompt = generateSelectionPrompt(actionType, selectedText, {
        problemTitle: problem.title,
      });
      openAIChatWithPrefill(prompt);
      clearWindowSelection();
    },
    [problem.title, openAIChatWithPrefill]
  );

  // Dismiss selection menu
  const handleSelectionDismiss = useCallback(() => {
    clearWindowSelection();
  }, []);

  // Session-level accordion state overrides (explicit user interactions this session)
  const [sessionOverrides, setSessionOverrides] = useState<Map<string, boolean>>(new Map());

  // Text search hook - open sections when search finds matches
  const handleSectionsToOpen = useCallback((sectionIds: Set<string>) => {
    setSessionOverrides((prev) => {
      const next = new Map(prev);
      sectionIds.forEach(id => next.set(id, true));
      return next;
    });
  }, []);

  // Sync search open state with layout store
  const handleSearchClose = useCallback(() => {
    closeProblemSearch();
  }, [closeProblemSearch]);

  const search = useTextSearch({
    containerRef: contentRef,
    onSectionsToOpen: handleSectionsToOpen,
  });

  // Sync isProblemSearchOpen with search.isOpen
  useEffect(() => {
    if (isProblemSearchOpen && !search.isOpen) {
      search.open();
    } else if (!isProblemSearchOpen && search.isOpen) {
      search.close();
    }
  }, [isProblemSearchOpen, search]);

  // Parse sections from description
  const sections = useMemo(() => parseDescription(problem.description_md), [problem.description_md]);

  // Get summary for sticky area - prefer problem.summary field
  const summary = useMemo(() => getSummary(problem), [problem]);

  // Separate sticky sections (overview, io, constraints) from accordion sections
  const stickyTypes = new Set(['overview', 'io', 'constraints', 'task']);
  const stickySections = sections.filter(s => stickyTypes.has(s.type));
  // Filter accordion to only show "테스트 전략" sections in sidebar
  const sidebarDisplayTypes = new Set(['strategy']);
  const accordionSections = sections.filter(s => !stickyTypes.has(s.type) && sidebarDisplayTypes.has(s.type));

  // Accordion toggle handler - toggle section and record in session overrides
  const handleAccordionToggle = useCallback((sectionId: string, sectionType: AccordionSectionType) => {
    setSessionOverrides((prev) => {
      const next = new Map(prev);
      // Get current state: session override > global default
      const currentState = prev.has(sectionId)
        ? prev.get(sectionId)!
        : accordionDefaults[sectionType] ?? true;
      // Toggle to opposite state
      next.set(sectionId, !currentState);
      return next;
    });
  }, [accordionDefaults]);

  // Get accordion open state: session override takes precedence over global default
  const isAccordionOpen = useCallback(
    (sectionId: string, sectionType: AccordionSectionType) => {
      // Session override takes precedence
      if (sessionOverrides.has(sectionId)) {
        return sessionOverrides.get(sectionId)!;
      }
      // Fall back to global default from store
      return accordionDefaults[sectionType] ?? true;
    },
    [sessionOverrides, accordionDefaults]
  );

  // Collapsed state - minimal vertical bar
  if (isProblemCollapsed) {
    return (
      <div
        data-testid="problem-panel-collapsed"
        className="h-full bg-slate-900 border-r border-slate-700 flex flex-col items-center py-2"
      >
        <button
          data-testid="btn-expand-problem"
          onClick={toggleProblemPanel}
          className="p-1.5 rounded-lg hover:bg-slate-700
                     bg-slate-800 shadow-sm border border-slate-600
                     transition-colors group"
          aria-label="문제 패널 펼치기"
          title="문제 패널 펼치기 (Ctrl+B)"
        >
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
        </button>

        <div className="mt-3 flex flex-col items-center gap-1">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] text-slate-500 writing-mode-vertical whitespace-nowrap">
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
      className="h-full flex flex-col bg-slate-900 border-r border-slate-700 overflow-hidden"
    >
      {/* ===== STICKY AREA ===== */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-slate-900">
        {/* Header with Back Link */}
        <div className="px-3 py-2 border-b border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <Link
              href="/problems"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>문제 목록</span>
            </Link>
            <button
              data-testid="btn-collapse-problem"
              onClick={toggleProblemPanel}
              className="p-1 rounded hover:bg-slate-800 transition-colors"
              aria-label="문제 패널 접기"
              title="문제 패널 접기 (Ctrl+B)"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold text-white truncate flex-1">
              {problem.title}
            </h1>
            <button
              onClick={toggleProblemSearch}
              className={`p-1 rounded transition-colors ${
                isProblemSearchOpen
                  ? "bg-sky-900/30 text-sky-400"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              }`}
              aria-label="문제 내 검색"
              title="문제 내 검색 (Ctrl+F)"
              data-testid="btn-problem-search"
            >
              <Search className="w-4 h-4" />
            </button>
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

        {/* Search Bar - conditionally visible */}
        {isProblemSearchOpen && (
          <ProblemSearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            currentIndex={search.currentIndex}
            totalCount={search.totalCount}
            caseSensitive={search.caseSensitive}
            onToggleCaseSensitive={search.toggleCaseSensitive}
            onNext={search.goNext}
            onPrev={search.goPrev}
            onClose={handleSearchClose}
          />
        )}

        {/* 확장 모드 토글 버튼 */}
        <div ref={testPointsRef} className="px-3 py-2 border-b border-slate-700">
          <button
            onClick={toggleProblemPeek}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              isExpandedMode
                ? "bg-purple-900/30 text-purple-400 border-purple-700 hover:bg-purple-900/40"
                : "bg-sky-900/20 text-sky-400 border-sky-700 hover:bg-sky-900/30"
            }`}
            title={isExpandedMode ? "문제 접기 (Alt+P)" : "전체 문제 보기 (Alt+P)"}
          >
            {isExpandedMode ? (
              <>
                <ChevronUp className="w-4 h-4" />
                문제 접기
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                전체 문제 보기
              </>
            )}
          </button>
        </div>

      </div>

      {/* ===== SCROLLABLE CONTENT AREA ===== */}
      <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto">
        {isExpandedMode ? (
          /* ===== 확장 모드: 전체 문제 설명 ===== */
          <div className="p-4 space-y-4">
            {/* 1. 문제 설명 (시나리오) - 가장 먼저 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                문제 설명
              </h2>
              <div className="prose prose-sm max-w-none text-slate-300 leading-relaxed">
                <MarkdownContent content={problem.description_md} />
              </div>
            </div>

            {/* 2. 함수 시그니처 */}
            {problem.function_signature && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  함수 시그니처
                </h3>
                <div className="relative group">
                  <pre className="p-3 bg-slate-950 rounded-lg border border-purple-700/50 text-sm font-mono text-purple-300 overflow-x-auto">
                    {problem.function_signature}
                  </pre>
                  <CopyButton
                    text={problem.function_signature}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            )}

            {/* 3. 핵심 테스트 포인트 */}
            {summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-400" />
                  핵심 테스트 포인트
                </h3>
                <div className="bg-sky-900/20 rounded-lg p-3 border border-sky-700">
                  <TestPointsList
                    content={summary.replace(/\s*•\s*/g, '\n• ')}
                    className="text-sm text-slate-300 [&_strong]:text-slate-100 [&_strong]:font-semibold"
                  />
                </div>
              </div>
            )}

            {/* AI Hint Panel */}
            <HintPanel problemId={problem.id} />

            {/* 테스트 전략 아코디언 */}
            {accordionSections.length > 0 && (
              <div className="space-y-2">
                {accordionSections.map((section, index) => {
                  const config = getSectionConfig(section.type);
                  const Icon = config.icon;
                  const sectionId = `section-${section.type}-${index}`;

                  const accordionType = (
                    ['examples', 'hints', 'exceptions', 'function', 'strategy'].includes(section.type)
                      ? section.type
                      : 'other'
                  ) as AccordionSectionType;

                  return (
                    <Accordion
                      key={index}
                      title={section.title}
                      icon={Icon}
                      iconColor={config.iconColor}
                      bgColor={config.bgColor}
                      sectionId={sectionId}
                      isOpen={isAccordionOpen(sectionId, accordionType)}
                      onToggle={() => handleAccordionToggle(sectionId, accordionType)}
                    >
                      <MarkdownContent content={section.content} />
                    </Accordion>
                  );
                })}
              </div>
            )}

            {/* Standard Library Notice */}
            <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>이 환경에서는 Python 표준 라이브러리만 사용할 수 있습니다.</span>
              </p>
            </div>
          </div>
        ) : (
          /* ===== 기본 모드: 요약 표시 ===== */
          <>
            {/* 핵심 테스트 포인트 - 체크리스트 스타일 */}
            {summary && (
              <div className="p-3 pb-0">
                <div className="bg-sky-900/20 rounded-lg p-2.5 border border-sky-700">
                  <TestPointsList
                    content={summary.replace(/\s*•\s*/g, '\n• ')}
                    className="text-xs text-slate-400 [&_strong]:text-slate-200 [&_strong]:font-semibold"
                  />
                </div>
              </div>
            )}

            {/* M5-5: AI Hint Panel */}
            <div className="p-3 pb-0">
              <HintPanel problemId={problem.id} />
            </div>

            {/* Standard Library Notice - 힌트 하단 */}
            <div className="mx-3 mt-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>이 환경에서는 Python 표준 라이브러리만 사용할 수 있습니다.</span>
              </p>
            </div>

            {accordionSections.length > 0 && (
              <div className="p-3 space-y-2">
                {accordionSections.map((section, index) => {
                  const config = getSectionConfig(section.type);
                  const Icon = config.icon;
                  const sectionId = `section-${section.type}-${index}`;

                  const accordionType = (
                    ['examples', 'hints', 'exceptions', 'function', 'strategy'].includes(section.type)
                      ? section.type
                      : 'other'
                  ) as AccordionSectionType;

                  return (
                    <Accordion
                      key={index}
                      title={section.title}
                      icon={Icon}
                      iconColor={config.iconColor}
                      bgColor={config.bgColor}
                      sectionId={sectionId}
                      isOpen={isAccordionOpen(sectionId, accordionType)}
                      onToggle={() => handleAccordionToggle(sectionId, accordionType)}
                    >
                      <MarkdownContent content={section.content} />
                    </Accordion>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* M5-4: Selection Action Menu */}
      <SelectionActionMenu
        selection={selection}
        onAction={handleSelectionAction}
        onDismiss={handleSelectionDismiss}
      />
    </div>
  );
}
