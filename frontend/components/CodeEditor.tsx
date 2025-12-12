/** Code Editor component using Monaco Editor */

"use client";

import { useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { registerPythonCompletions } from "@/lib/monacoConfig";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
  language?: string;
}

// Track if completions have been registered
let completionsRegistered = false;

export default function CodeEditor({
  value,
  onChange,
  height = "400px",
  readOnly = false,
  language = "python",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();

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

  // Determine Monaco theme based on resolved theme
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";

  return (
    <div className="border border-[var(--card-border)] rounded-lg overflow-hidden transition-colors">
      <Editor
        height={height}
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
    </div>
  );
}

