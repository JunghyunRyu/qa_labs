"use client";

import { useState } from "react";
import { FlaskConical, FileText, ScrollText, History, ChevronUp, ChevronDown } from "lucide-react";
import LocalTestResultPanel from "@/components/LocalTestResultPanel";
import type { PytestResult } from "@/workers/pyodide-worker-types";

// Core loop tabs: 로컬 테스트 → 채점 결과 → 로그, with 히스토리 as 4th
export type TabId = "local" | "result" | "logs" | "history";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "local", label: "로컬 테스트", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "result", label: "채점 결과", icon: <FileText className="w-4 h-4" /> },
  { id: "logs", label: "로그", icon: <ScrollText className="w-4 h-4" /> },
  { id: "history", label: "히스토리", icon: <History className="w-4 h-4" /> },
];

interface BottomTabsProps {
  className?: string;
  /** Controlled active tab */
  activeTab?: TabId;
  /** Tab change callback */
  onTabChange?: (tab: TabId) => void;
  /** Controlled expanded state */
  isExpanded?: boolean;
  /** Expand toggle callback */
  onExpandToggle?: (expanded: boolean) => void;
  /** Local test props */
  localTestResult?: PytestResult | null;
  localTestError?: string | null;
  isLocalTesting?: boolean;
  localTestProgress?: string;
  onLocalTestRetry?: () => void;
}

export default function BottomTabs({
  className = "",
  activeTab: controlledActiveTab,
  onTabChange,
  isExpanded: controlledIsExpanded,
  onExpandToggle,
  localTestResult,
  localTestError,
  isLocalTesting = false,
  localTestProgress,
  onLocalTestRetry,
}: BottomTabsProps) {
  // Internal state for uncontrolled mode
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>("local");
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);

  // Use controlled or uncontrolled mode
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const isExpanded = controlledIsExpanded ?? internalIsExpanded;

  const handleTabChange = (tab: TabId) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handleExpandToggle = () => {
    const newExpanded = !isExpanded;
    if (onExpandToggle) {
      onExpandToggle(newExpanded);
    } else {
      setInternalIsExpanded(newExpanded);
    }
  };

  // Check if local test has content to show
  const hasLocalTestContent = isLocalTesting || localTestResult || localTestError;

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Tab Headers */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 -mb-px bg-sky-50 dark:bg-sky-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {tab.icon}
            {tab.label}
            {/* Indicator dot for local test activity */}
            {tab.id === "local" && isLocalTesting && (
              <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
            {tab.id === "local" && !isLocalTesting && localTestResult && (
              <span className={`ml-1 w-2 h-2 rounded-full ${
                localTestResult.failed === 0 && localTestResult.errors === 0
                  ? "bg-green-500"
                  : "bg-amber-500"
              }`} />
            )}
            {tab.id === "local" && !isLocalTesting && localTestError && (
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        ))}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={handleExpandToggle}
          className="ml-auto px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={isExpanded ? "패널 축소" : "패널 확장"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Local Test Tab */}
        {activeTab === "local" && (
          <div className="h-full">
            {hasLocalTestContent ? (
              <LocalTestResultPanel
                result={localTestResult ?? null}
                isRunning={isLocalTesting}
                error={localTestError ?? null}
                progressMessage={localTestProgress}
                onRetry={onLocalTestRetry}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">로컬 테스트 결과 없음</p>
                  <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                    <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      Shift+Enter
                    </kbd>
                    {" 또는 '로컬 테스트' 버튼을 클릭하세요"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Tab - Placeholder */}
        {activeTab === "result" && (
          <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">채점 결과 없음</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Ctrl+Enter
                </kbd>
                {" 또는 '채점하기' 버튼을 클릭하세요"}
              </p>
            </div>
          </div>
        )}

        {/* Logs Tab - Placeholder */}
        {activeTab === "logs" && (
          <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">로그 없음</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                테스트 실행 또는 채점 후 상세 로그가 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}

        {/* History Tab - Placeholder */}
        {activeTab === "history" && (
          <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">제출 히스토리 없음</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                이전 제출 기록이 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
