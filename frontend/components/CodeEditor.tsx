/** Code Editor component using Monaco Editor */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { GripHorizontal } from "lucide-react";
import { registerPythonCompletions } from "@/lib/monacoConfig";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  height?: string;
  minHeight?: number;
  maxHeight?: number;
  resizable?: boolean;
  readOnly?: boolean;
  language?: string;
}

// Track if completions have been registered
let completionsRegistered = false;

export default function CodeEditor({
  value,
  onChange,
  height = "400px",
  minHeight = 200,
  maxHeight = 800,
  resizable = false,
  readOnly = false,
  language = "python",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Parse initial height from string (e.g., "300px" -> 300)
  const parseHeight = (h: string): number => {
    const match = h.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 400;
  };

  const [editorHeight, setEditorHeight] = useState(() => parseHeight(height));
  const [isResizing, setIsResizing] = useState(false);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Register Python completions only once
    if (!completionsRegistered && language === "python") {
      registerPythonCompletions(monaco);
      completionsRegistered = true;
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Python language settings
    if (language === "python") {
      editor.updateOptions({
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
    }
  };

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const newHeight = clientY - containerRect.top;

    // Clamp height between min and max
    const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
    setEditorHeight(clampedHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove);
      document.addEventListener('touchend', handleResizeEnd);
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Determine Monaco theme based on resolved theme
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";

  const actualHeight = resizable ? `${editorHeight}px` : height;

  return (
    <div
      ref={containerRef}
      className="border border-[var(--card-border)] rounded-lg overflow-hidden transition-colors"
    >
      <Editor
        height={actualHeight}
        language={language}
        value={value}
        onChange={onChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        theme={monacoTheme}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 4,
          insertSpaces: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "top",
        }}
      />

      {/* Resize Handle */}
      {resizable && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className={`
            flex items-center justify-center h-6
            bg-gray-100 dark:bg-gray-700
            border-t border-[var(--card-border)]
            cursor-ns-resize select-none
            hover:bg-gray-200 dark:hover:bg-gray-600
            transition-colors
            ${isResizing ? 'bg-gray-200 dark:bg-gray-600' : ''}
          `}
          title="드래그하여 에디터 크기 조절"
        >
          <GripHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
            드래그하여 크기 조절
          </span>
        </div>
      )}
    </div>
  );
}

