"use client";

import { useState } from "react";
import { FileText, History, MessageSquare } from "lucide-react";

type TabId = "result" | "history" | "feedback";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "result", label: "결과", icon: <FileText className="w-4 h-4" /> },
  { id: "history", label: "히스토리", icon: <History className="w-4 h-4" /> },
  { id: "feedback", label: "AI 피드백", icon: <MessageSquare className="w-4 h-4" /> },
];

interface BottomTabsProps {
  className?: string;
}

export default function BottomTabs({ className = "" }: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("result");

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Tab Headers */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 -mb-px bg-sky-50 dark:bg-sky-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="flex items-center justify-center h-full min-h-[120px] text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🚧</div>
            <p className="text-sm">준비 중</p>
            <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
              {activeTab === "result" && "채점 결과가 여기에 표시됩니다"}
              {activeTab === "history" && "제출 히스토리가 여기에 표시됩니다"}
              {activeTab === "feedback" && "AI 피드백이 여기에 표시됩니다"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
