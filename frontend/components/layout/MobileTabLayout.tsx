"use client";

import { FileText, Code2, Bot } from "lucide-react";
import { useLayoutStore } from "@/stores/layoutStore";
import { motion, AnimatePresence } from "framer-motion";

interface MobileTabLayoutProps {
  problemPanel: React.ReactNode;
  codePanel: React.ReactNode;
  aiPanel: React.ReactNode;
}

const tabs = [
  { id: "problem" as const, label: "문제", icon: FileText },
  { id: "code" as const, label: "코드", icon: Code2 },
  { id: "ai" as const, label: "AI", icon: Bot },
];

export default function MobileTabLayout({
  problemPanel,
  codePanel,
  aiPanel,
}: MobileTabLayoutProps) {
  const { activeTab, setActiveTab } = useLayoutStore();

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4
                         text-sm font-medium transition-colors relative
                         ${
                           isActive
                             ? "text-purple-600 dark:text-purple-400"
                             : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                         }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "problem" && (
            <motion.div
              key="problem"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              {problemPanel}
            </motion.div>
          )}

          {activeTab === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {codePanel}
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              {aiPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
