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
    setPanelWidth(40);
  }, [setPanelWidth]);

  // Don't render until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <div className={`flex h-full ${className}`}>
        <div className="w-[40%] h-full">{leftPanel}</div>
        <div className="flex-1 h-full">{rightPanel}</div>
      </div>
    );
  }

  // When collapsed, show minimal left panel
  if (isProblemCollapsed) {
    return (
      <div className={`flex h-full ${className}`}>
        <div className="w-12 h-full flex-shrink-0">{leftPanel}</div>
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
        minSize={20}
        maxSize={55}
        className="h-full"
      >
        {leftPanel}
      </Panel>

      <PanelResizeHandle
        className="group w-1 hover:w-2 bg-gray-200 dark:bg-gray-700
                   hover:bg-blue-400 dark:hover:bg-blue-500
                   transition-all duration-150 flex items-center justify-center
                   cursor-col-resize"
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity
                      text-white"
        >
          <GripVertical size={12} />
        </div>
      </PanelResizeHandle>

      <Panel minSize={30} className="h-full">
        {rightPanel}
      </Panel>
    </PanelGroup>
  );
}
