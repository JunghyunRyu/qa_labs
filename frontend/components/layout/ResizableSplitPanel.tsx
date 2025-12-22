"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useLayoutStore } from "@/stores/layoutStore";
import { useCallback, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";

interface ResizableSplitPanelProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
}

export default function ResizableSplitPanel({
  leftPanel,
  rightPanel,
  className = "",
}: ResizableSplitPanelProps) {
  const { panelWidth, isProblemCollapsed, setPanelWidth } = useLayoutStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for client-side hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleResize = useCallback(
    (sizes: number[]) => {
      if (sizes[0]) {
        setPanelWidth(sizes[0]);
      }
    },
    [setPanelWidth]
  );

  // Reset to default width on double-click
  const handleDoubleClick = useCallback(() => {
    setPanelWidth(35); // 35% problem / 65% code
  }, [setPanelWidth]);

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <div className={`flex h-full ${className}`}>
        <div className="w-[35%] h-full">{leftPanel}</div>
        <div className="flex-1 h-full">{rightPanel}</div>
      </div>
    );
  }

  // When collapsed, code takes ~100% width with minimal problem indicator
  if (isProblemCollapsed) {
    return (
      <div className={`flex h-full ${className}`}>
        {/* Minimal collapsed bar - just expand button */}
        <div className="w-10 h-full flex-shrink-0">{leftPanel}</div>
        <div className="flex-1 h-full min-w-0">{rightPanel}</div>
      </div>
    );
  }

  return (
    <PanelGroup
      direction="horizontal"
      onLayout={handleResize}
      className={`h-full ${className}`}
    >
      <Panel
        defaultSize={panelWidth}
        minSize={22}
        maxSize={55}
        className="h-full"
      >
        {leftPanel}
      </Panel>

      <PanelResizeHandle
        className="group w-1.5 hover:w-2 bg-gray-200 dark:bg-gray-700
                   hover:bg-sky-400 dark:hover:bg-sky-500
                   active:bg-sky-500 dark:active:bg-sky-600
                   transition-colors duration-150 flex items-center justify-center
                   cursor-col-resize"
        onDoubleClick={handleDoubleClick}
        title="드래그하여 패널 크기 조절 (더블클릭: 기본값)"
      >
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity
                      text-white"
        >
          <GripVertical size={14} />
        </div>
      </PanelResizeHandle>

      <Panel minSize={40} className="h-full">
        {rightPanel}
      </Panel>
    </PanelGroup>
  );
}
